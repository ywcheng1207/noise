import { GoogleGenAI } from '@google/genai'
import { prisma } from '@/lib/prisma'
import type { PipelineStage } from '@/lib/generated/prisma'

/** 模型選擇。免費層 flash-lite 容易 503，分群也改用 flash；最難推理可選 pro。 */
export const MODEL = {
	CLUSTER: 'gemini-2.5-flash',
	RESEARCH: 'gemini-2.5-flash',
	REASON: 'gemini-2.5-pro',
} as const

/** 近似單價（USD / 1M tokens）。實際以 Google 官方定價為準。 */
const PRICING: Record<string, { in: number; out: number }> = {
	'gemini-2.5-flash-lite': { in: 0.1, out: 0.4 },
	'gemini-2.5-flash': { in: 0.3, out: 2.5 },
	'gemini-2.5-pro': { in: 1.25, out: 10 },
}
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
	const p = PRICING[model] ?? PRICING['gemini-2.5-flash']
	const input = usage.promptTokenCount ?? 0
	const output = usage.candidatesTokenCount ?? 0
	return (input * p.in + output * p.out) / 1_000_000 + searches * SEARCH_PRICE_USD
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
	return /\b(503|429)\b|UNAVAILABLE|RESOURCE_EXHAUSTED|high demand|overloaded|deadline/i.test(msg)
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

/** 產生 JSON（含 Google Search 接地）：不能用 responseMimeType，靠 prompt 指示 + 解析。 */
export async function generateJsonWithSearch<T>(opts: { model: string; system: string; prompt: string }) {
	const res = await withRetry(() =>
		getGemini().models.generateContent({
			model: opts.model,
			contents: opts.prompt,
			config: {
				systemInstruction: opts.system,
				tools: [{ googleSearch: {} }],
				temperature: 0.3,
				maxOutputTokens: 8000,
			},
		}),
	)
	const usage: UsageLike = res.usageMetadata ?? {}
	const searches = res.candidates?.[0]?.groundingMetadata?.groundingChunks?.length ?? 0
	return { data: parseJsonObject<T>(res.text ?? ''), usage, searches }
}
