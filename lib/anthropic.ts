import Anthropic from '@anthropic-ai/sdk'
import { prisma } from '@/lib/prisma'
import type { PipelineStage } from '@/lib/generated/prisma'

/** 模型選擇（見 CLAUDE.md AI/Claude 規則）。勿加日期後綴。 */
export const MODEL = {
	CLUSTER: 'claude-haiku-4-5',
	RESEARCH: 'claude-sonnet-4-6',
	REASON: 'claude-opus-4-8',
} as const

/** 每 1M token 美元單價（input / output / cache-read）。 */
const PRICING: Record<string, { in: number; out: number; cacheRead: number }> = {
	'claude-haiku-4-5': { in: 1, out: 5, cacheRead: 0.1 },
	'claude-sonnet-4-6': { in: 3, out: 15, cacheRead: 0.3 },
	'claude-opus-4-8': { in: 5, out: 25, cacheRead: 0.5 },
}
const SEARCH_PRICE_USD = 0.01

let client: Anthropic | null = null

export function getAnthropic() {
	if (!client) {
		const apiKey = process.env.ANTHROPIC_API_KEY
		if (!apiKey) throw new Error('ANTHROPIC_API_KEY is not set')
		client = new Anthropic({ apiKey })
	}
	return client
}

interface UsageLike {
	input_tokens?: number
	output_tokens?: number
	cache_read_input_tokens?: number | null
}

export function estimateCostUsd(model: string, usage: UsageLike, webSearches = 0) {
	const p = PRICING[model] ?? PRICING['claude-sonnet-4-6']
	const input = usage.input_tokens ?? 0
	const output = usage.output_tokens ?? 0
	const cacheRead = usage.cache_read_input_tokens ?? 0
	return (input * p.in + output * p.out + cacheRead * p.cacheRead) / 1_000_000 + webSearches * SEARCH_PRICE_USD
}

interface ContentBlockLike {
	type: string
	text?: string
	name?: string
}

/** 取出回應中的 text 區塊合併。 */
export function extractText(message: { content: ContentBlockLike[] }) {
	return message.content
		.filter((b) => b.type === 'text')
		.map((b) => b.text ?? '')
		.join('\n')
		.trim()
}

/** 從可能夾雜文字的回應中抽出第一個 JSON 物件並解析。 */
export function parseJsonObject<T>(raw: string): T {
	const start = raw.indexOf('{')
	const end = raw.lastIndexOf('}')
	if (start === -1 || end === -1) throw new Error('No JSON object found in model response')
	return JSON.parse(raw.slice(start, end + 1))
}

/** 計算 server-side web_search 使用次數（成本記錄用）。 */
export function countWebSearches(message: { content: ContentBlockLike[] }) {
	return message.content.filter((b) => b.type === 'server_tool_use' && b.name === 'web_search').length
}

export async function logAiRun(params: {
	eventId?: string
	stage: PipelineStage
	model: string
	usage: UsageLike
	webSearches?: number
	batchId?: string
}) {
	const { eventId, stage, model, usage, webSearches = 0, batchId } = params
	await prisma.aiRun.create({
		data: {
			eventId: eventId ?? null,
			stage,
			model,
			inputTokens: usage.input_tokens ?? 0,
			outputTokens: usage.output_tokens ?? 0,
			cacheReadTokens: usage.cache_read_input_tokens ?? 0,
			webSearches,
			costUsd: estimateCostUsd(model, usage, webSearches),
			batchId: batchId ?? null,
		},
	})
}
