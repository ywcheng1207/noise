import { GoogleGenAI } from '@google/genai'
import { prisma } from '@/lib/prisma'
import type { PipelineStage } from '@/lib/generated/prisma'

/** 模型選擇（2026-07 盤點）。
 *  分群/歸類升級 gemini-3.1-flash-lite（GA，比 2.5-flash 便宜且更強，實測 JSON 輸出正常）。
 *  研究維持 gemini-2.5-flash：3.5-flash 實測接地會執行、但回應完全不帶 groundingMetadata
 *  （無 webSearchQueries/groundingChunks），會弄壞搜尋成本記帳、日誌的搜尋次數與來源網址驗證，
 *  等 Google 補上 Gemini 3 的接地中繼資料再升級。 */
export const MODEL = {
	CLUSTER: 'gemini-3.1-flash-lite',
	RESEARCH: 'gemini-2.5-flash',
	REASON: 'gemini-3.1-pro-preview',
} as const

/** 近似單價（USD / 1M tokens）。實際以 Google 官方定價為準。 */
const PRICING: Record<string, { in: number; out: number }> = {
	'gemini-2.5-flash-lite': { in: 0.1, out: 0.4 },
	'gemini-2.5-flash': { in: 0.3, out: 2.5 },
	'gemini-2.5-pro': { in: 1.25, out: 10 },
	'gemini-3.1-flash-lite': { in: 0.25, out: 1.5 },
	'gemini-3.5-flash': { in: 1.5, out: 9 },
	'gemini-3.1-pro-preview': { in: 2, out: 12 },
}
// Gemini 2.5 接地按「有接地的 prompt」計費（$35/1,000 次），與單次 prompt 內執行幾個查詢無關。
const SEARCH_PRICE_USD = 0.035

let client: GoogleGenAI | null = null

export function getGemini() {
	if (!client) {
		const apiKey = process.env.GEMINI_API_KEY
		if (!apiKey) throw new Error('GEMINI_API_KEY is not set')
		client = new GoogleGenAI({ apiKey })
	}
	return client
}

interface UsageLike {
	promptTokenCount?: number
	candidatesTokenCount?: number
}

export function estimateCostUsd(model: string, usage: UsageLike, searches = 0) {
	const p = PRICING[model] ?? PRICING[MODEL.RESEARCH]
	const input = usage.promptTokenCount ?? 0
	const output = usage.candidatesTokenCount ?? 0
	// searches 記的是該 prompt 內實際執行的查詢數（供日誌顯示），但 2.5 的接地費用按 prompt 計。
	return (input * p.in + output * p.out) / 1_000_000 + (searches > 0 ? SEARCH_PRICE_USD : 0)
}

/** 從可能夾雜文字的回應中抽出第一個 JSON 物件並解析。 */
export function parseJsonObject<T>(raw: string): T {
	const start = raw.indexOf('{')
	const end = raw.lastIndexOf('}')
	if (start === -1 || end === -1) throw new Error('No JSON object found in model response')
	return JSON.parse(raw.slice(start, end + 1))
}

export async function logAiRun(params: {
	eventId?: string
	stage: PipelineStage
	model: string
	usage: UsageLike
	searches?: number
}) {
	const { eventId, stage, model, usage, searches = 0 } = params
	await prisma.aiRun.create({
		data: {
			eventId: eventId ?? null,
			stage,
			model,
			inputTokens: usage.promptTokenCount ?? 0,
			outputTokens: usage.candidatesTokenCount ?? 0,
			cacheReadTokens: 0,
			webSearches: searches,
			costUsd: estimateCostUsd(model, usage, searches),
		},
	})
}

function isRetryable(err: unknown) {
	const msg = err instanceof Error ? err.message : JSON.stringify(err)
	return /\b(503|429)\b|UNAVAILABLE|RESOURCE_EXHAUSTED|high demand|overloaded|deadline|EMPTY_MODEL_RESPONSE/i.test(
		msg,
	)
}

/** Gemini 免費層常回 503/429，包一層重試 + 指數退避（在 60s 函式預算內）。 */
async function withRetry<T>(fn: () => Promise<T>, attempts = 4): Promise<T> {
	let lastErr: unknown
	for (let i = 0; i < attempts; i++) {
		try {
			return await fn()
		} catch (err) {
			lastErr = err
			if (!isRetryable(err) || i === attempts - 1) throw err
			await new Promise((r) => setTimeout(r, 800 * 2 ** i + Math.random() * 400))
		}
	}
	throw lastErr
}

/** 產生 JSON（無搜尋）：用 responseMimeType 強制 JSON 輸出。 */
export async function generateJson<T>(opts: { model: string; system: string; prompt: string }) {
	const res = await withRetry(() =>
		getGemini().models.generateContent({
			model: opts.model,
			contents: opts.prompt,
			config: {
				systemInstruction: opts.system,
				responseMimeType: 'application/json',
				temperature: 0.2,
			},
		}),
	)
	const usage: UsageLike = res.usageMetadata ?? {}
	return { data: parseJsonObject<T>(res.text ?? ''), usage }
}

/** Google Search 接地回傳的真實搜尋結果（程式化取得，保證是真的網頁，不是模型手打的網址）。 */
export interface GroundingSource {
	uri: string
	title: string
}

/** 產生 JSON（含 Google Search 接地）：不能用 responseMimeType，靠 prompt 指示 + 解析。 */
export async function generateJsonWithSearch<T>(opts: { model: string; system: string; prompt: string }) {
	const res = await withRetry(async () => {
		const r = await getGemini().models.generateContent({
			model: opts.model,
			contents: opts.prompt,
			config: {
				systemInstruction: opts.system,
				tools: [{ googleSearch: {} }],
				temperature: 0.3,
				// thinking tokens 也計入 maxOutputTokens；上限拉高並限制 thinking，
				// 避免 thinking 吃光預算導致 res.text 為空（grounding 路徑常見）。
				// 注意 thinkingBudget 是 2.5 系列參數；若改用 Gemini 3 需換成 thinkingLevel。
				maxOutputTokens: 12000,
				thinkingConfig: { thinkingBudget: 3000 },
			},
		})
		if (!r.text || r.text.trim() === '') throw new Error('EMPTY_MODEL_RESPONSE')
		return r
	})
	const usage: UsageLike = res.usageMetadata ?? {}
	const grounding = res.candidates?.[0]?.groundingMetadata
	const chunks = grounding?.groundingChunks ?? []
	const groundedSources: GroundingSource[] = chunks.flatMap((c) =>
		c.web?.uri ? [{ uri: c.web.uri, title: c.web.title ?? '' }] : [],
	)
	// 實測 groundingChunks 常為空、webSearchQueries 才是實際執行的查詢清單；用後者計數，chunks 當備援。
	const searches = grounding?.webSearchQueries?.length ?? chunks.length
	return { data: parseJsonObject<T>(res.text ?? ''), usage, searches, groundedSources }
}
