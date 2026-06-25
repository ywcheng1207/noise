import { prisma } from '@/lib/prisma'
import { MODEL, logAiRun, generateJson } from '@/lib/gemini'
import { normalizeDomain, normalizeRegions } from '@/lib/enums'
import { slugify } from '@/lib/utils'

interface ClusterResult {
	clusters: Array<{
		titleZh: string
		titleEn: string
		domain: string
		regions: string[]
		importance: number
		articleIndexes: number[]
	}>
}

const IMPORTANCE_THRESHOLD = 0.5

/** 用 Gemini flash-lite 把 NEW 文章分群為事件；達門檻者標記 PENDING_RESEARCH。
 *  單批控制在 ~50 篇，讓 Gemini 一次呼叫穩定落在 Hobby 60s 函式上限內；剩餘留待下輪 cron。 */
export async function runCluster(limit = 50) {
	const articles = await prisma.article.findMany({
		where: { status: 'NEW' },
		take: limit,
		orderBy: { fetchedAt: 'desc' },
	})
	if (articles.length === 0) return { clustered: 0, events: 0 }

	const list = articles.map((a, i) => `${i}. ${a.title}`).join('\n')
	const system =
		'你是新聞分群助手。把描述同一真實世界事件的文章分到同一群，每群給中英文標題、領域、相關地區、重要性(0~1)。'
	const prompt = `文章清單（index. 標題）：\n${list}\n\n領域只能用：INTL, POLITICS, BIZ, TECH, DISASTER, SOCIETY, OTHER。\n地區只能用：MIDEAST, EAST_ASIA, SE_ASIA, SOUTH_ASIA, CENTRAL_ASIA, EUROPE, NORTH_AMERICA, SOUTH_AMERICA, AFRICA, OCEANIA, GLOBAL。\n只回 JSON：{"clusters":[{"titleZh":"","titleEn":"","domain":"","regions":[],"importance":0.0,"articleIndexes":[]}]}`

	const { data: parsed, usage } = await generateJson<ClusterResult>({
		model: MODEL.CLUSTER,
		system,
		prompt,
	})
	await logAiRun({ stage: 'CLUSTER', model: MODEL.CLUSTER, usage })

	let events = 0
	for (const cluster of parsed.clusters ?? []) {
		const importance = typeof cluster.importance === 'number' ? cluster.importance : 0
		const event = await prisma.event.create({
			data: {
				slug: `${slugify(cluster.titleEn) || 'event'}-${Date.now().toString(36)}-${events}`,
				titleZh: cluster.titleZh,
				titleEn: cluster.titleEn,
				domain: normalizeDomain(cluster.domain),
				regions: normalizeRegions(cluster.regions ?? []),
				importanceScore: importance,
				status: importance >= IMPORTANCE_THRESHOLD ? 'PENDING_RESEARCH' : 'CANDIDATE',
			},
		})
		events++

		const ids = (cluster.articleIndexes ?? [])
			.map((i) => articles[i]?.id)
			.filter((id): id is string => Boolean(id))
		if (ids.length > 0) {
			await prisma.article.updateMany({
				where: { id: { in: ids } },
				data: { status: 'CLUSTERED', eventId: event.id },
			})
		}
	}

	return { clustered: articles.length, events }
}
