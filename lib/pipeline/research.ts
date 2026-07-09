import { prisma } from '@/lib/prisma'
import { MODEL, logAiRun, generateJsonWithSearch, type GroundingSource } from '@/lib/gemini'
import { normalizeMediaType, normalizeReliability, normalizeTier } from '@/lib/enums'
import { resolveVerifiedUrl } from '@/lib/pipeline/verifyUrl'
import { THREAD_CONFIG } from '@/lib/pipeline/config'
import { toTraditionalZh, toTraditionalZhOrNull } from '@/lib/zh'
import { parseOccurredDate } from '@/lib/dates'

interface ResearchResult {
	narrativeZh: string
	narrativeEn: string
	overallReliability: string
	topicDigestZh?: string
	topicDigestEn?: string
	timeline: Array<{
		occurredDate?: string
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

const RESULT_JSON_SHAPE =
	'{"narrativeZh":"","narrativeEn":"","overallReliability":"VERIFIED|DEVELOPING|DISPUTED|UNVERIFIED","topicDigestZh":"","topicDigestEn":"","timeline":[{"occurredDate":"2026-06-18","descZh":"","descEn":"","sourceLabel":"","sourceUrl":"","isConflicting":false}],"sources":[{"sourceName":"","externalUrl":"","language":"en","mediaType":"TEXT","credibilityTier":"OFFICIAL|HIGH|MEDIUM|LOW|UNVERIFIED","isAuthoritative":false,"reasoningZh":"","reasoningEn":""}]}'

function topicDigestPromptLine(topic: { titleZh: string; digestZh: string | null } | null) {
	if (!topic) return ''
	return `\n\n此事件所屬脈絡「${topic.titleZh}」目前態勢摘要：${topic.digestZh ?? '（尚無摘要，這是此脈絡第一次有事件完成研究）'}\n請一併給出這條脈絡基於本次研究結果、更新後的最新兩三句摘要（topicDigestZh/En）。`
}

/** 對單一事件用 Gemini + Google Search 接地研究，寫入敘事/時序/來源。事件一生僅此一次完整研究。 */
export async function researchEvent(eventId: string) {
	const event = await prisma.event.findUnique({
		where: { id: eventId },
		include: { articles: true, topic: { select: { id: true, titleZh: true, digestZh: true } } },
	})
	if (!event) throw new Error('event not found')

	const seeds = event.articles.map((a) => `- ${a.title} (${a.canonicalUrl})`).join('\n') || '(無種子)'
	const system =
		'你是新聞事件研究員。針對事件跨來源查證（用 Google 搜尋，不限語系），排出時間序列、講清來龍去脈、依可信度排名來源並標出官方/最高可信來源。評分針對單篇報導或單一主張，不對媒體機構作人格評價。每個主張都要有來源。所有中文欄位一律使用正體中文（臺灣用語），即使來源報導為簡體。'
	const prompt = `事件：${event.titleZh} / ${event.titleEn}\n種子報導：\n${seeds}${topicDigestPromptLine(event.topic)}\n\n查證後只回 JSON（不要其他文字、不要 markdown；narrativeZh/En 各 2–3 句、timeline 最多 4 節點、sources 最多 4 個，力求精簡以加快回應）。\ntimeline 的 occurredDate 一律用 ISO 格式：確定到日用 YYYY-MM-DD，只確定到月用 YYYY-MM，只確定到年用 YYYY，不要寫其他文字。\n每個來源請標 language（ISO 639-1 語言代碼，如 en/zh/ar/fr）與 mediaType（影音報導用 VIDEO，文字報導用 TEXT）：\n${RESULT_JSON_SHAPE}`

	const {
		data: parsed,
		usage,
		searches,
		groundedSources,
	} = await generateJsonWithSearch<ResearchResult>({
		model: MODEL.RESEARCH,
		system,
		prompt,
	})
	await logAiRun({ eventId, stage: 'RESEARCH', model: MODEL.RESEARCH, usage, searches })

	await writeResearchResult(eventId, event.topicId, parsed, groundedSources)
	return { eventId, timeline: parsed.timeline?.length ?? 0, sources: parsed.sources?.length ?? 0 }
}

/**
 * 輕量研究：事件累積續報達門檻後，唯一一次增量更新。帶入既有研究結果當上下文，
 * 要求模型只需在既有基礎上更新，不重新驗證未變動的背景——之後即凍結，不再研究。
 */
export async function refreshEvent(eventId: string) {
	const event = await prisma.event.findUnique({
		where: { id: eventId },
		include: {
			articles: true,
			timeline: { orderBy: { rank: 'asc' } },
			sources: { orderBy: { rank: 'asc' } },
			topic: { select: { id: true, titleZh: true, digestZh: true } },
		},
	})
	if (!event) throw new Error('event not found')

	const seeds = event.articles.map((a) => `- ${a.title} (${a.canonicalUrl})`).join('\n') || '(無種子)'
	const existingTimeline =
		event.timeline.map((n) => `- ${n.occurredLabel ?? ''} ${n.descZh}`).join('\n') || '(無)'
	const existingSources =
		event.sources.map((s) => `- ${s.sourceName}（${s.credibilityTier}）`).join('\n') || '(無)'

	const system =
		'你是新聞事件研究員，正在對一個已經研究過、之後持續有續報的事件做「增量更新」，不是從零開始研究。已確立的背景不必重新查證，重點是把新進展併入既有時序與敘事。用 Google 搜尋查證新增的部分（不限語系）。所有中文欄位一律使用正體中文（臺灣用語）。'
	const prompt = `事件：${event.titleZh} / ${event.titleEn}\n\n既有敘事：${event.narrativeZh ?? ''}\n既有時序：\n${existingTimeline}\n既有來源：\n${existingSources}\n\n目前完整種子報導清單（含先前已用過的與續報新增的）：\n${seeds}${topicDigestPromptLine(event.topic)}\n\n請給出更新後的完整敘事、時序與來源（不是只列新增的部分，而是合併既有與新進展後的完整版本），只回 JSON（不要其他文字、不要 markdown；narrativeZh/En 各 2–3 句、timeline 最多 6 節點、sources 最多 6 個）：\n${RESULT_JSON_SHAPE}`

	const {
		data: parsed,
		usage,
		searches,
		groundedSources,
	} = await generateJsonWithSearch<ResearchResult>({
		model: MODEL.RESEARCH,
		system,
		prompt,
	})
	await logAiRun({ eventId, stage: 'RESEARCH', model: MODEL.RESEARCH, usage, searches })

	await writeResearchResult(eventId, event.topicId, parsed, groundedSources)
	await prisma.event.update({ where: { id: eventId }, data: { refreshedAt: new Date() } })
	return { eventId, timeline: parsed.timeline?.length ?? 0, sources: parsed.sources?.length ?? 0 }
}

async function writeResearchResult(
	eventId: string,
	topicId: string | null,
	parsed: ResearchResult,
	groundedSources: GroundingSource[],
) {
	const timeline = parsed.timeline ?? []
	const sources = parsed.sources ?? []

	// Gemini 在 JSON 裡手打的網址不保證真的存在（可能記錯、或引用已下架的頁面）；
	// 用真正的 Google Search 接地結果驗證/替換，確認死掉的一律拿掉，不留死連結給使用者點。
	const [verifiedTimelineUrls, verifiedSourceUrls] = await Promise.all([
		Promise.all(timeline.map((n) => resolveVerifiedUrl(n.sourceUrl, groundedSources))),
		Promise.all(sources.map((s) => resolveVerifiedUrl(s.externalUrl, groundedSources))),
	])

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
		data: timeline.map((n, i) => ({
			eventId,
			...parseOccurredDate(n.occurredDate),
			descZh: toTraditionalZh(n.descZh),
			descEn: n.descEn,
			sourceUrl: verifiedTimelineUrls[i],
			sourceLabel: n.sourceLabel ?? null,
			isConflicting: Boolean(n.isConflicting),
			rank: i,
		})),
	})

	await prisma.eventSource.createMany({
		data: sources.map((s, i) => ({
			eventId,
			sourceName: toTraditionalZh(s.sourceName),
			externalUrl: verifiedSourceUrls[i],
			language: s.language ? s.language.toLowerCase().slice(0, 5) : null,
			mediaType: normalizeMediaType(s.mediaType),
			credibilityTier: normalizeTier(s.credibilityTier),
			isAuthoritative: Boolean(s.isAuthoritative),
			reasoningZh: toTraditionalZhOrNull(s.reasoningZh),
			reasoningEn: s.reasoningEn ?? null,
			rank: i,
		})),
	})

	if (topicId && (parsed.topicDigestZh || parsed.topicDigestEn)) {
		await prisma.topic.update({
			where: { id: topicId },
			data: {
				digestZh: parsed.topicDigestZh ? toTraditionalZh(parsed.topicDigestZh) : undefined,
				digestEn: parsed.topicDigestEn ?? undefined,
				lastActivityAt: new Date(),
			},
		})
	}
}

/** 掃描 OPEN 且超過續報等待期無新續報的事件，轉為 CLOSED。純 DB 操作，無 AI 成本。 */
export async function closeStaleEvents() {
	const cutoff = new Date(Date.now() - THREAD_CONFIG.FOLLOW_UP_WINDOW_HOURS * 60 * 60 * 1000)
	const { count } = await prisma.event.updateMany({
		where: { closedAt: null, status: 'RESEARCHED', lastUpdatedAt: { lt: cutoff } },
		data: { closedAt: new Date() },
	})
	return { closed: count }
}

/** 找出累積續報達門檻、尚未執行輕量研究的 OPEN 事件，排入輕量研究佇列。 */
export async function findEventsNeedingRefresh(limit = 1) {
	return prisma.event.findMany({
		where: {
			closedAt: null,
			status: 'RESEARCHED',
			refreshedAt: null,
			corroborationCount: { gte: THREAD_CONFIG.REFRESH_THRESHOLD },
		},
		orderBy: { lastUpdatedAt: 'desc' },
		take: limit,
		select: { id: true },
	})
}
