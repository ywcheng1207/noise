import { prisma } from '@/lib/prisma'
import { MODEL, logAiRun, generateJson } from '@/lib/gemini'
import { normalizeDomain, normalizeRegions } from '@/lib/enums'
import { slugify } from '@/lib/utils'

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

	const existing = await prisma.topic.findMany({ select: { slug: true, titleZh: true, titleEn: true } })
	const known = existing.map((t) => `${t.slug}: ${t.titleZh} / ${t.titleEn}`).join('\n') || '(無)'

	const system = '你把單一新聞事件歸入一個跨時間的「核心議題」。符合既有議題就沿用它的 slug，否則建立新議題。'
	const prompt = `事件：${event.titleZh} / ${event.titleEn}\n既有核心議題（slug: 標題）：\n${known}\n\n只回 JSON：{"topicSlug":"kebab-slug","topicTitleZh":"","topicTitleEn":""}`

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
			titleZh: assignment.topicTitleZh,
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
			regions: normalizeRegions(Array.from(regionSet)),
			spanStart,
			spanEnd,
			overallReliability: overall,
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
