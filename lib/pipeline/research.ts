import { prisma } from '@/lib/prisma'
import { MODEL, logAiRun, generateJsonWithSearch } from '@/lib/gemini'
import { normalizeMediaType, normalizeReliability, normalizeTier } from '@/lib/enums'
import { toTraditionalZh, toTraditionalZhOrNull } from '@/lib/zh'

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
		language?: string
		mediaType?: string
		credibilityTier: string
		isAuthoritative?: boolean
		reasoningZh?: string
		reasoningEn?: string
	}>
}

/** 對單一事件用 Gemini + Google Search 接地研究，寫入敘事/時序/來源。 */
export async function researchEvent(eventId: string) {
	const event = await prisma.event.findUnique({ where: { id: eventId }, include: { articles: true } })
	if (!event) throw new Error('event not found')

	const seeds = event.articles.map((a) => `- ${a.title} (${a.canonicalUrl})`).join('\n') || '(無種子)'
	const system =
		'你是新聞事件研究員。針對事件跨來源查證（用 Google 搜尋，不限語系），排出時間序列、講清來龍去脈、依可信度排名來源並標出官方/最高可信來源。評分針對單篇報導或單一主張，不對媒體機構作人格評價。每個主張都要有來源。所有中文欄位一律使用正體中文（臺灣用語），即使來源報導為簡體。'
	const prompt = `事件：${event.titleZh} / ${event.titleEn}\n種子報導：\n${seeds}\n\n查證後只回 JSON（不要其他文字、不要 markdown；narrativeZh/En 各 2–3 句、timeline 最多 4 節點、sources 最多 4 個，力求精簡以加快回應）。\n每個來源請標 language（ISO 639-1 語言代碼，如 en/zh/ar/fr）與 mediaType（影音報導用 VIDEO，文字報導用 TEXT）：\n{"narrativeZh":"","narrativeEn":"","overallReliability":"VERIFIED|DEVELOPING|DISPUTED|UNVERIFIED","timeline":[{"occurredLabel":"6/18","descZh":"","descEn":"","sourceLabel":"","sourceUrl":"","isConflicting":false}],"sources":[{"sourceName":"","externalUrl":"","language":"en","mediaType":"TEXT","credibilityTier":"OFFICIAL|HIGH|MEDIUM|LOW|UNVERIFIED","isAuthoritative":false,"reasoningZh":"","reasoningEn":""}]}`

	const { data: parsed, usage, searches } = await generateJsonWithSearch<ResearchResult>({
		model: MODEL.RESEARCH,
		system,
		prompt,
	})
	await logAiRun({ eventId, stage: 'RESEARCH', model: MODEL.RESEARCH, usage, searches })

	await prisma.eventTimeline.deleteMany({ where: { eventId } })
	await prisma.eventSource.deleteMany({ where: { eventId } })

	await prisma.event.update({
		where: { id: eventId },
		data: {
			narrativeZh: toTraditionalZh(parsed.narrativeZh),
			narrativeEn: parsed.narrativeEn,
			overallReliability: normalizeReliability(parsed.overallReliability),
			status: 'RESEARCHED',
		},
	})

	await prisma.eventTimeline.createMany({
		data: (parsed.timeline ?? []).map((n, i) => ({
			eventId,
			occurredLabel: toTraditionalZhOrNull(n.occurredLabel),
			descZh: toTraditionalZh(n.descZh),
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
			sourceName: toTraditionalZh(s.sourceName),
			externalUrl: s.externalUrl ?? null,
			language: s.language ? s.language.toLowerCase().slice(0, 5) : null,
			mediaType: normalizeMediaType(s.mediaType),
			credibilityTier: normalizeTier(s.credibilityTier),
			isAuthoritative: Boolean(s.isAuthoritative),
			reasoningZh: toTraditionalZhOrNull(s.reasoningZh),
			reasoningEn: s.reasoningEn ?? null,
			rank: i,
		})),
	})

	return { eventId, timeline: parsed.timeline?.length ?? 0, sources: parsed.sources?.length ?? 0 }
}
