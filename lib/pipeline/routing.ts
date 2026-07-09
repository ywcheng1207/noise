import { prisma } from '@/lib/prisma'
import { MODEL, logAiRun, generateJson } from '@/lib/gemini'
import { isFocusDomain, normalizeDomain, normalizeRegions } from '@/lib/enums'
import { slugify } from '@/lib/utils'
import { toTraditionalZh } from '@/lib/zh'
import { upgradeReliabilityForCorroboration } from '@/lib/pipeline/corroboration'
import { refreshTopicStats } from '@/lib/pipeline/topics'
import type { Topic } from '@/lib/generated/prisma'

const IMPORTANCE_THRESHOLD = 0.5
const MAX_OPEN_EVENTS_PER_TOPIC = 5

type RoutingKind = 'mainline_existing' | 'mainline_fastgate' | 'follow_up' | 'candidate' | 'noise'

interface RoutingItem {
	kind: RoutingKind
	articleIndexes: number[]
	topicSlug?: string
	eventSlug?: string
	titleZh?: string
	titleEn?: string
	domain?: string
	regions?: string[]
	importance?: number
	topicTitleZh?: string
	topicTitleEn?: string
	charterWhyZh?: string
	charterWhyEn?: string
	charterCriteriaZh?: string
	charterCriteriaEn?: string
	charterActorsZh?: string[]
	charterActorsEn?: string[]
	signalZh?: string
	signalEn?: string
}

interface RoutingResult {
	items: RoutingItem[]
}

type ContextTopic = Pick<
	Topic,
	'id' | 'slug' | 'titleZh' | 'lifecycle' | 'charterWhyZh' | 'charterCriteriaZh' | 'charterActorsZh'
>
interface ContextEvent {
	id: string
	slug: string
	titleZh: string
	topicId: string | null
}

/**
 * 分流（取代原本的「分群」）：把新文章依「是否屬於已在追蹤的脈絡」分成五類，
 * 而不只是問「講不講同一件事」。mainline 才建立新 Event，其餘四類都不觸發研究成本。
 */
export async function runRouting(limit = 50) {
	const articles = await prisma.article.findMany({
		where: { status: 'NEW' },
		take: limit,
		orderBy: { fetchedAt: 'desc' },
	})
	if (articles.length === 0) return { routed: 0, mainline: 0, followUp: 0, candidate: 0, noise: 0 }

	const { contextTopics, openEventsByTopic, allOpenEvents } = await loadRoutingContext()
	const topicContext = buildTopicContext(contextTopics, openEventsByTopic)
	const articleList = articles.map((a, i) => `${i}. ${a.title}`).join('\n')

	const system =
		'你是新聞分流編輯。任務是把新文章依「是否屬於已在追蹤的脈絡」分類，而不是單純判斷文章講不講同一件事。中文一律使用正體中文（臺灣用語），即使原文為簡體。'
	const prompt = `【既有追蹤中的脈絡】（每個脈絡列出收錄判準與目前開放中的事件；不符合任何脈絡收錄判準的新聞才需要另外評估）\n${topicContext}\n\n【新文章清單】（index. 標題）\n${articleList}\n\n對每篇文章判斷屬於下列哪一類，同一類且同一具體事件的文章可合併成一個 item：\n\n1. mainline_existing：符合上面某脈絡的收錄判準，且是該脈絡底下一則新的具體事件（不是任何既有 OPEN 事件的延續）。給 topicSlug（複製脈絡清單的 slug）、titleZh/En、domain、regions、importance(0~1)。\n2. follow_up：明顯是對上面某個 OPEN 事件的補充報導（同一件事的後續消息）。給 eventSlug（複製該事件的 slug）。\n3. mainline_fastgate：不符合任何既有脈絡，但重要性非常明確——同時考慮規模/不可逆性、意外性、是否牽動其他已追蹤脈絡、行為者層級，只有清楚達到「值得立刻獨立成一條新脈絡追蹤」才用這類，不確定就別用。給 titleZh/En（首個事件標題）、domain、regions、importance、topicTitleZh/En（新脈絡標題）、charterWhyZh/En（為什麼重要）、charterCriteriaZh/En（收錄判準：以後這條脈絡要收哪些後續發展、不收哪些）、charterActorsZh/En（關鍵行為者陣列）。\n4. candidate：不符合任何既有脈絡，重要性不到 mainline_fastgate 門檻，但也非顯然無關緊要，值得先觀察。給 titleZh/En、signalZh/En（一句話說明為什麼值得觀察）、domain、regions。\n5. noise：以上皆非。\n\n領域只能用：INTL, POLITICS, BIZ, TECH（其餘領域一律歸類 noise）。\n地區只能用：MIDEAST, EAST_ASIA, SE_ASIA, SOUTH_ASIA, CENTRAL_ASIA, EUROPE, NORTH_AMERICA, SOUTH_AMERICA, AFRICA, OCEANIA, GLOBAL。\n\n凡是要求 titleZh/En、topicTitleZh/En、charterXxxZh/En、signalZh/En 的欄位，中英文兩個版本都必填，不可只給中文或只給英文。\n\n只回 JSON：{"items":[{"kind":"mainline_existing|follow_up|mainline_fastgate|candidate|noise","articleIndexes":[0],"topicSlug":"","eventSlug":"","titleZh":"","titleEn":"","domain":"","regions":[],"importance":0.0,"topicTitleZh":"","topicTitleEn":"","charterWhyZh":"","charterWhyEn":"","charterCriteriaZh":"","charterCriteriaEn":"","charterActorsZh":[],"charterActorsEn":[],"signalZh":"","signalEn":""}]}`

	const { data: parsed, usage } = await generateJson<RoutingResult>({ model: MODEL.CLUSTER, system, prompt })
	await logAiRun({ stage: 'CLUSTER', model: MODEL.CLUSTER, usage })

	const topicBySlug = new Map(contextTopics.map((t) => [t.slug, t]))
	const eventBySlug = new Map(allOpenEvents.map((e) => [e.slug, e]))
	const touchedTopicIds = new Set<string>()

	let mainline = 0
	let followUp = 0
	let candidate = 0
	let noise = 0

	for (const item of parsed.items ?? []) {
		const ids = (item.articleIndexes ?? [])
			.map((i) => articles[i]?.id)
			.filter((id): id is string => Boolean(id))
		if (ids.length === 0) continue

		if (item.kind === 'noise') {
			await markSkipped(ids)
			noise++
			continue
		}

		if (item.kind === 'candidate') {
			await upsertCandidate(item)
			await markSkipped(ids)
			candidate++
			continue
		}

		if (item.kind === 'follow_up') {
			const event = item.eventSlug ? eventBySlug.get(item.eventSlug) : undefined
			if (!event) {
				// 模型給的 eventSlug 對不上任何目前 OPEN 事件，保守當雜訊處理，避免誤掛到錯的事件。
				await markSkipped(ids)
				noise++
				continue
			}
			await applyFollowUp(event, ids)
			if (event.topicId) touchedTopicIds.add(event.topicId)
			followUp++
			continue
		}

		// mainline_existing 或 mainline_fastgate
		const domain = normalizeDomain(item.domain ?? '')
		if (!isFocusDomain(domain)) {
			await markSkipped(ids)
			noise++
			continue
		}

		const existingTopic = item.topicSlug ? topicBySlug.get(item.topicSlug) : undefined
		const topicId = existingTopic
			? await reviveIfDormant(existingTopic)
			: (await createFastGateTopic(item)).id

		const importance = typeof item.importance === 'number' ? item.importance : 0
		const titleEn = item.titleEn || item.titleZh || ''
		const event = await prisma.event.create({
			data: {
				slug: `${slugify(titleEn) || 'event'}-${Date.now().toString(36)}-${mainline}`,
				topicId,
				titleZh: toTraditionalZh(item.titleZh || item.titleEn || ''),
				titleEn,
				domain,
				regions: normalizeRegions(item.regions ?? []),
				importanceScore: importance,
				status: importance >= IMPORTANCE_THRESHOLD ? 'PENDING_RESEARCH' : 'CANDIDATE',
			},
		})
		await prisma.article.updateMany({
			where: { id: { in: ids } },
			data: { status: 'CLUSTERED', eventId: event.id },
		})
		touchedTopicIds.add(topicId)
		mainline++
	}

	await Promise.all(Array.from(touchedTopicIds).map((id) => refreshTopicStats(id)))

	return { routed: articles.length, mainline, followUp, candidate, noise }
}

async function loadRoutingContext() {
	const contextTopics = await prisma.topic.findMany({
		where: { lifecycle: { in: ['ACTIVE', 'DORMANT'] }, charterCriteriaZh: { not: null } },
		select: {
			id: true,
			slug: true,
			titleZh: true,
			titleEn: true,
			domain: true,
			interval: true,
			overallReliability: true,
			lifecycle: true,
			charterWhyZh: true,
			charterCriteriaZh: true,
			charterActorsZh: true,
		},
	})
	const topicIds = contextTopics.map((t) => t.id)
	const allOpenEvents: ContextEvent[] = topicIds.length
		? await prisma.event.findMany({
				where: { topicId: { in: topicIds }, closedAt: null },
				orderBy: { lastUpdatedAt: 'desc' },
				select: { id: true, slug: true, titleZh: true, topicId: true },
			})
		: []

	const openEventsByTopic = new Map<string, ContextEvent[]>()
	for (const ev of allOpenEvents) {
		if (!ev.topicId) continue
		const list = openEventsByTopic.get(ev.topicId) ?? []
		if (list.length < MAX_OPEN_EVENTS_PER_TOPIC) list.push(ev)
		openEventsByTopic.set(ev.topicId, list)
	}

	return { contextTopics, openEventsByTopic, allOpenEvents }
}

function buildTopicContext(topics: ContextTopic[], openEventsByTopic: Map<string, ContextEvent[]>) {
	if (topics.length === 0) return '(目前沒有任何既有脈絡)'
	return topics
		.map((t) => {
			const events = openEventsByTopic.get(t.id) ?? []
			const eventLines = events.map((e) => `  - (${e.slug}) ${e.titleZh}`).join('\n') || '  (無 OPEN 事件)'
			return `[${t.slug}] ${t.titleZh}\n  為什麼重要：${t.charterWhyZh ?? ''}\n  收錄判準：${t.charterCriteriaZh ?? ''}\n  關鍵行為者：${(t.charterActorsZh ?? []).join('、')}\n${eventLines}`
		})
		.join('\n\n')
}

async function markSkipped(articleIds: string[]) {
	await prisma.article.updateMany({ where: { id: { in: articleIds } }, data: { status: 'SKIPPED' } })
}

async function reviveIfDormant(topic: ContextTopic) {
	if (topic.lifecycle === 'DORMANT') {
		await prisma.topic.update({ where: { id: topic.id }, data: { lifecycle: 'ACTIVE', dormantAt: null } })
	}
	return topic.id
}

async function applyFollowUp(event: ContextEvent, articleIds: string[]) {
	await prisma.article.updateMany({
		where: { id: { in: articleIds } },
		data: { status: 'CLUSTERED', eventId: event.id },
	})
	// 續報一律重新打開：即使原本已 CLOSED，收到新續報代表這件事還沒真的結束。
	const updated = await prisma.event.update({
		where: { id: event.id },
		data: { corroborationCount: { increment: articleIds.length }, closedAt: null },
	})
	const upgraded = upgradeReliabilityForCorroboration(updated.overallReliability, updated.corroborationCount)
	if (upgraded !== updated.overallReliability) {
		await prisma.event.update({ where: { id: event.id }, data: { overallReliability: upgraded } })
	}
	if (event.topicId) {
		const topic = await prisma.topic.findUnique({ where: { id: event.topicId }, select: { lifecycle: true } })
		await prisma.topic.update({
			where: { id: event.topicId },
			data: {
				lastActivityAt: new Date(),
				...(topic?.lifecycle === 'DORMANT' ? { lifecycle: 'ACTIVE' as const, dormantAt: null } : {}),
			},
		})
	}
}

async function createFastGateTopic(item: RoutingItem) {
	const titleZh = item.topicTitleZh || item.titleZh || item.topicTitleEn || item.titleEn || ''
	const titleEn = item.topicTitleEn || item.titleEn || item.topicTitleZh || item.titleZh || ''
	const slug = `${slugify(titleEn) || 'thread'}-${Date.now().toString(36)}`
	return prisma.topic.create({
		data: {
			slug,
			titleZh: toTraditionalZh(titleZh),
			titleEn,
			domain: normalizeDomain(item.domain ?? ''),
			regions: normalizeRegions(item.regions ?? []),
			lifecycle: 'ACTIVE',
			charterWhyZh: item.charterWhyZh ? toTraditionalZh(item.charterWhyZh) : null,
			charterWhyEn: item.charterWhyEn ?? null,
			charterCriteriaZh: item.charterCriteriaZh ? toTraditionalZh(item.charterCriteriaZh) : null,
			charterCriteriaEn: item.charterCriteriaEn ?? null,
			charterActorsZh: (item.charterActorsZh ?? []).map((a) => toTraditionalZh(a)),
			charterActorsEn: item.charterActorsEn ?? [],
			lastActivityAt: new Date(),
		},
	})
}

// 候選池目前用「標題完全相同（忽略大小寫）」去重：候選是低風險的觀察名單，
// 重複幾筆不會造成誤導，換取不必為此另外呼叫 AI 做語意去重的成本。
async function upsertCandidate(item: RoutingItem) {
	const titleZh = item.titleZh || item.titleEn || ''
	const titleEn = item.titleEn || item.titleZh || ''
	if (!titleZh && !titleEn) return

	const existing = await prisma.threadCandidate.findFirst({
		where: { status: 'WATCHING', titleEn: { equals: titleEn, mode: 'insensitive' } },
	})
	if (existing) {
		await prisma.threadCandidate.update({
			where: { id: existing.id },
			data: { mentionCount: { increment: 1 }, lastSpottedAt: new Date() },
		})
		return
	}

	await prisma.threadCandidate.create({
		data: {
			titleZh: toTraditionalZh(titleZh),
			titleEn,
			signalZh: item.signalZh ? toTraditionalZh(item.signalZh) : null,
			signalEn: item.signalEn ?? null,
			domain: normalizeDomain(item.domain ?? ''),
			regions: normalizeRegions(item.regions ?? []),
		},
	})
}
