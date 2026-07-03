import { prisma } from '@/lib/prisma'
import { MODEL, logAiRun, generateJson } from '@/lib/gemini'
import { normalizeDomain, normalizeRegions, normalizeReliability } from '@/lib/enums'
import { slugify } from '@/lib/utils'
import { toTraditionalZh } from '@/lib/zh'

interface TopicAssignment {
	topicSlug: string
	topicTitleZh: string
	topicTitleEn: string
}

const RELIABILITY_RANK: Record<string, number> = {
	VERIFIED: 0,
	DEVELOPING: 1,
	DISPUTED: 2,
	UNVERIFIED: 3,
}

/** 用 Gemini 把事件歸入既有或新建的核心議題，並更新議題統計。 */
export async function assignEventToTopic(eventId: string) {
	const event = await prisma.event.findUnique({ where: { id: eventId } })
	if (!event) throw new Error('event not found')

	const existing = await prisma.topic.findMany({
		select: { slug: true, titleZh: true, titleEn: true, domain: true },
	})
	const known =
		existing.map((t) => `${t.slug} [${t.domain}]: ${t.titleZh} / ${t.titleEn}`).join('\n') || '(無)'

	const system =
		'你把單一新聞事件歸入一個跨時間的「核心議題」。強烈優先沿用既有議題：只要事件與某議題屬於同一條故事線（同一場衝突、同一個政策議程、同一組國家或公司間的角力），就沿用該議題的 slug，即使標題措辭不同。僅在與所有既有議題都明顯無關時才建立新議題。中文一律使用正體中文（臺灣用語）。'
	const prompt = `事件：${event.titleZh} / ${event.titleEn}\n既有核心議題（slug [領域]: 標題）：\n${known}\n\n只回 JSON：{"topicSlug":"kebab-slug","topicTitleZh":"","topicTitleEn":""}`

	const { data: assignment, usage } = await generateJson<TopicAssignment>({
		model: MODEL.CLUSTER,
		system,
		prompt,
	})
	await logAiRun({ eventId, stage: 'CLUSTER', model: MODEL.CLUSTER, usage })

	const slug = slugify(assignment.topicSlug || assignment.topicTitleEn) || 'topic'

	const topic = await prisma.topic.upsert({
		where: { slug },
		create: {
			slug,
			titleZh: toTraditionalZh(assignment.topicTitleZh),
			titleEn: assignment.topicTitleEn,
			domain: normalizeDomain(event.domain),
			regions: event.regions,
		},
		update: {},
	})

	await prisma.event.update({ where: { id: eventId }, data: { topicId: topic.id } })
	await refreshTopicStats(topic.id)
	return { eventId, topicSlug: slug }
}

interface ConsolidationResult {
	merges: Array<{ keepSlug: string; mergeSlugs: string[] }>
}

/** 用 Gemini 找出描述同一故事線的重複議題並合併（事件移轉 → 刪除重複議題 → 重算統計）。 */
export async function consolidateTopics() {
	const topics = await prisma.topic.findMany({
		select: {
			id: true,
			slug: true,
			titleZh: true,
			titleEn: true,
			domain: true,
			_count: { select: { events: true } },
		},
	})
	if (topics.length < 2) return { merged: 0, details: [] }

	const list = topics
		.map((t) => `${t.slug} [${t.domain}] (${t._count.events} events): ${t.titleZh} / ${t.titleEn}`)
		.join('\n')
	const system =
		'你負責收斂新聞核心議題：找出清單中描述同一條故事線（同一場衝突、同一個政策議程、同一組角力關係）的重複議題。僅在高度確信兩個議題實質相同時才合併；不確定就不合併。keepSlug 選事件數較多或標題涵蓋面較廣者。'
	const prompt = `既有核心議題（slug [領域] (事件數): 標題）：\n${list}\n\n只回 JSON（沒有可合併的就回空陣列）：{"merges":[{"keepSlug":"","mergeSlugs":[""]}]}`

	const { data: parsed, usage } = await generateJson<ConsolidationResult>({
		model: MODEL.CLUSTER,
		system,
		prompt,
	})
	await logAiRun({ stage: 'CLUSTER', model: MODEL.CLUSTER, usage })

	const bySlug = new Map(topics.map((t) => [t.slug, t]))
	let merged = 0
	const details: string[] = []

	for (const group of parsed.merges ?? []) {
		const keep = bySlug.get(group.keepSlug)
		if (!keep) continue
		for (const mergeSlug of group.mergeSlugs ?? []) {
			const victim = bySlug.get(mergeSlug)
			// 防呆：不存在、自己合自己、跨領域的一律跳過
			if (!victim || victim.id === keep.id || victim.domain !== keep.domain) continue
			await prisma.event.updateMany({ where: { topicId: victim.id }, data: { topicId: keep.id } })
			await prisma.topic.delete({ where: { id: victim.id } })
			bySlug.delete(mergeSlug)
			merged++
			details.push(`${mergeSlug} -> ${group.keepSlug}`)
		}
		await refreshTopicStats(keep.id)
	}

	return { merged, details }
}

/** 重新彙整議題統計（事件數/來源數/地區/時間跨度/整體可靠度/時間區間）。 */
export async function refreshTopicStats(topicId: string) {
	const topic = await prisma.topic.findUnique({
		where: { id: topicId },
		include: { events: { include: { sources: true } } },
	})
	if (!topic) return

	const events = topic.events
	const regionSet = new Set<string>()
	events.forEach((e) => e.regions.forEach((r) => regionSet.add(r)))
	const sourceCount = events.reduce((sum, e) => sum + e.sources.length, 0)
	const languageSet = new Set<string>()
	events.forEach((e) => e.sources.forEach((s) => s.language && languageSet.add(s.language)))
	const spanStart = events.reduce<Date | null>(
		(min, e) => (!min || e.firstSeenAt < min ? e.firstSeenAt : min),
		null,
	)
	const spanEnd = events.reduce<Date | null>(
		(max, e) => (!max || e.lastUpdatedAt > max ? e.lastUpdatedAt : max),
		null,
	)
	const overall = events.reduce(
		(worst, e) =>
			(RELIABILITY_RANK[e.overallReliability] ?? 1) > (RELIABILITY_RANK[worst] ?? 1)
				? e.overallReliability
				: worst,
		'VERIFIED',
	)

	await prisma.topic.update({
		where: { id: topicId },
		data: {
			eventCount: events.length,
			sourceCount,
			languageCount: languageSet.size,
			regions: normalizeRegions(Array.from(regionSet)),
			spanStart,
			spanEnd,
			overallReliability: normalizeReliability(overall),
			interval: computeInterval(spanEnd),
		},
	})
}

function computeInterval(spanEnd: Date | null) {
	if (!spanEnd) return 'ONGOING'
	const days = (Date.now() - spanEnd.getTime()) / 86_400_000
	if (days <= 1) return 'TODAY'
	if (days <= 7) return 'WEEK'
	if (days <= 31) return 'MONTH'
	return 'ONGOING'
}
