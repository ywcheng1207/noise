import { prisma } from '@/lib/prisma'
import {
	getAnthropic,
	MODEL,
	logAiRun,
	extractText,
	parseJsonObject,
	countWebSearches,
} from '@/lib/anthropic'
import { normalizeReliability, normalizeTier } from '@/lib/enums'

interface ResearchResult {
	narrativeZh: string
	narrativeEn: string
	overallReliability: string
	timeline: Array<{
		occurredLabel?: string
		descZh: string
		descEn: string
		sourceLabel?: string
		sourceUrl?: string
		isConflicting?: boolean
	}>
	sources: Array<{
		sourceName: string
		externalUrl?: string
		credibilityTier: string
		isAuthoritative?: boolean
		reasoningZh?: string
		reasoningEn?: string
	}>
}

/** 對單一事件跑 agentic 研究（web_search + web_fetch），寫入敘事/時序/來源。 */
export async function researchEvent(eventId: string) {
	const event = await prisma.event.findUnique({ where: { id: eventId }, include: { articles: true } })
	if (!event) throw new Error('event not found')

	const seeds = event.articles.map((a) => `- ${a.title} (${a.canonicalUrl})`).join('\n') || '(無種子)'
	const system =
		'你是新聞事件研究員。針對事件跨來源查證（可用 web_search / web_fetch，不限語系），排出時間序列、講清來龍去脈、依可信度排名來源並標出官方/最高可信來源。評分針對單篇報導或單一主張，不對媒體機構作人格評價。每個主張都要有來源。'
	const prompt = `事件：${event.titleZh} / ${event.titleEn}\n種子報導：\n${seeds}\n\n查證後只回 JSON（不要其他文字）：\n{"narrativeZh":"","narrativeEn":"","overallReliability":"VERIFIED|DEVELOPING|DISPUTED|UNVERIFIED","timeline":[{"occurredLabel":"6/18","descZh":"","descEn":"","sourceLabel":"","sourceUrl":"","isConflicting":false}],"sources":[{"sourceName":"","externalUrl":"","credibilityTier":"OFFICIAL|HIGH|MEDIUM|LOW|UNVERIFIED","isAuthoritative":false,"reasoningZh":"","reasoningEn":""}]}`

	const message = await getAnthropic().messages.create({
		model: MODEL.RESEARCH,
		max_tokens: 8000,
		system,
		tools: [
			{ type: 'web_search_20260209', name: 'web_search' },
			{ type: 'web_fetch_20260209', name: 'web_fetch' },
		],
		messages: [{ role: 'user', content: prompt }],
	})

	await logAiRun({
		eventId,
		stage: 'RESEARCH',
		model: MODEL.RESEARCH,
		usage: message.usage,
		webSearches: countWebSearches(message),
	})

	const parsed = parseJsonObject<ResearchResult>(extractText(message))

	await prisma.eventTimeline.deleteMany({ where: { eventId } })
	await prisma.eventSource.deleteMany({ where: { eventId } })

	await prisma.event.update({
		where: { id: eventId },
		data: {
			narrativeZh: parsed.narrativeZh,
			narrativeEn: parsed.narrativeEn,
			overallReliability: normalizeReliability(parsed.overallReliability),
			status: 'RESEARCHED',
		},
	})

	await prisma.eventTimeline.createMany({
		data: (parsed.timeline ?? []).map((n, i) => ({
			eventId,
			occurredLabel: n.occurredLabel ?? null,
			descZh: n.descZh,
			descEn: n.descEn,
			sourceUrl: n.sourceUrl ?? null,
			sourceLabel: n.sourceLabel ?? null,
			isConflicting: Boolean(n.isConflicting),
			rank: i,
		})),
	})

	await prisma.eventSource.createMany({
		data: (parsed.sources ?? []).map((s, i) => ({
			eventId,
			sourceName: s.sourceName,
			externalUrl: s.externalUrl ?? null,
			credibilityTier: normalizeTier(s.credibilityTier),
			isAuthoritative: Boolean(s.isAuthoritative),
			reasoningZh: s.reasoningZh ?? null,
			reasoningEn: s.reasoningEn ?? null,
			rank: i,
		})),
	})

	return { eventId, timeline: parsed.timeline?.length ?? 0, sources: parsed.sources?.length ?? 0 }
}
