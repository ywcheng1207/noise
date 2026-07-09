import { prisma } from '@/lib/prisma'
import { MODEL, logAiRun, generateJson } from '@/lib/gemini'
import { THREAD_CONFIG } from '@/lib/pipeline/config'
import { isOverDailyBudget } from '@/lib/pipeline/budget'
import { toTraditionalZh } from '@/lib/zh'
import { slugify } from '@/lib/utils'
import type { ThreadCandidate } from '@/lib/generated/prisma'

interface PromotionItem {
	candidateIndex: number
	evidenceStrength?: number
	topicTitleZh?: string
	topicTitleEn?: string
	charterWhyZh?: string
	charterWhyEn?: string
	charterCriteriaZh?: string
	charterCriteriaEn?: string
	charterActorsZh?: string[]
	charterActorsEn?: string[]
}

interface EditorialMeetingResult {
	archiveSlugs: string[]
	promote: PromotionItem[]
	dismissIndexes: number[]
}

function daysAgo(days: number) {
	return new Date(Date.now() - days * 24 * 60 * 60 * 1000)
}

function daysSince(date: Date) {
	return Math.floor((Date.now() - date.getTime()) / (24 * 60 * 60 * 1000))
}

/**
 * 每日一次的脈絡治理：ACTIVE→DORMANT 是純規則（不呼叫 AI，只看 lastActivityAt）；
 * DORMANT→ARCHIVED（含終局判定）與候選池轉正/淘汰需要判斷力，交給一次 AI 呼叫；
 * 在用脈絡上限由程式邏輯（非 AI）事後硬性把關。
 */
export async function runEditorialMeeting() {
	const decayed = await prisma.topic.updateMany({
		where: { lifecycle: 'ACTIVE', lastActivityAt: { lt: daysAgo(THREAD_CONFIG.TOPIC_DORMANT_DAYS) } },
		data: { lifecycle: 'DORMANT', dormantAt: new Date() },
	})

	if (await isOverDailyBudget()) {
		return { decayedToDormant: decayed.count, archived: 0, promoted: 0, dismissed: 0, skippedByBudget: true }
	}

	const dormantTopics = await prisma.topic.findMany({
		where: { lifecycle: 'DORMANT' },
		select: { id: true, slug: true, titleZh: true, dormantAt: true, lastActivityAt: true },
	})
	const candidates = await prisma.threadCandidate.findMany({
		where: { status: 'WATCHING' },
		orderBy: { lastSpottedAt: 'desc' },
	})

	if (dormantTopics.length === 0 && candidates.length === 0) {
		return { decayedToDormant: decayed.count, archived: 0, promoted: 0, dismissed: 0 }
	}

	const dormantContext =
		dormantTopics
			.map((t) => {
				const dormantDays = t.dormantAt ? daysSince(t.dormantAt) : '?'
				const inactiveDays = t.lastActivityAt ? daysSince(t.lastActivityAt) : '?'
				return `[${t.slug}] ${t.titleZh} — 休眠於 ${dormantDays} 天前（最後活動 ${inactiveDays} 天前）`
			})
			.join('\n') || '（無）'

	const candidateContext =
		candidates
			.map((c, i) => {
				const firstDays = daysSince(c.firstSpottedAt)
				const lastDays = daysSince(c.lastSpottedAt)
				return `${i}. ${c.titleZh} — 首次偵測 ${firstDays} 天前、最近偵測 ${lastDays} 天前、累積提及 ${c.mentionCount} 次，觀察理由：${c.signalZh ?? ''}`
			})
			.join('\n') || '（無）'

	const system =
		'你是新聞編輯台的每日盤點會議，負責兩件事：(1) 判斷休眠中的脈絡是否已有明確終局、可以封存；(2) 判斷候選觀察名單裡哪些已累積足夠多日、多來源證據，值得升格為正式追蹤的脈絡。中文一律使用正體中文（臺灣用語）。'
	const prompt = `【休眠中的脈絡】（不是單純看天數，請判斷是否已有明確終局——如停火協議簽署、選舉結果確定、併購案完成——天數不足也可以因為明確終局而封存）\n${dormantContext}\n\n【候選觀察名單】\n${candidateContext}\n\n輸出：archiveSlugs（判定已有明確終局可封存的休眠脈絡 slug）、promote（判定已累積足夠證據值得升格的候選，每筆給 candidateIndex、evidenceStrength(0~1，名額不足時優先保留高分者)、topicTitleZh/En、charterWhyZh/En、charterCriteriaZh/En、charterActorsZh/En）、dismissIndexes（訊號已消退——很久沒有新提及、提及次數沒有成長——該淘汰的候選 index）。\n\n只回 JSON：{"archiveSlugs":[],"promote":[{"candidateIndex":0,"evidenceStrength":0.0,"topicTitleZh":"","topicTitleEn":"","charterWhyZh":"","charterWhyEn":"","charterCriteriaZh":"","charterCriteriaEn":"","charterActorsZh":[],"charterActorsEn":[]}],"dismissIndexes":[]}`

	const { data: parsed, usage } = await generateJson<EditorialMeetingResult>({
		model: MODEL.CLUSTER,
		system,
		prompt,
	})
	await logAiRun({ stage: 'CLUSTER', model: MODEL.CLUSTER, usage })

	const dormantBySlug = new Map(dormantTopics.map((t) => [t.slug, t]))
	let archived = 0
	for (const slug of parsed.archiveSlugs ?? []) {
		const topic = dormantBySlug.get(slug)
		if (!topic) continue
		await prisma.topic.update({
			where: { id: topic.id },
			data: { lifecycle: 'ARCHIVED', archivedAt: new Date() },
		})
		archived++
	}

	// 候選轉正：程式邏輯硬性把關上限，AI 只負責建議與排優先序（evidenceStrength）。
	const activeCount = await prisma.topic.count({ where: { lifecycle: 'ACTIVE' } })
	let remainingSlots = THREAD_CONFIG.ACTIVE_THREAD_CAP - activeCount
	const sortedPromotions = [...(parsed.promote ?? [])].sort(
		(a, b) => (b.evidenceStrength ?? 0) - (a.evidenceStrength ?? 0),
	)
	let promoted = 0
	for (const promo of sortedPromotions) {
		if (remainingSlots <= 0) break
		const candidate = candidates[promo.candidateIndex]
		if (!candidate || candidate.status !== 'WATCHING') continue
		await promoteCandidate(candidate, promo)
		remainingSlots--
		promoted++
	}

	// 保險：若目前 ACTIVE 仍超過上限（如白天有快門新建脈絡），強制衰退活動時間最舊者直到符合上限。
	const overCap =
		(await prisma.topic.count({ where: { lifecycle: 'ACTIVE' } })) - THREAD_CONFIG.ACTIVE_THREAD_CAP
	if (overCap > 0) {
		const oldest = await prisma.topic.findMany({
			where: { lifecycle: 'ACTIVE' },
			orderBy: { lastActivityAt: 'asc' },
			take: overCap,
			select: { id: true },
		})
		await prisma.topic.updateMany({
			where: { id: { in: oldest.map((t) => t.id) } },
			data: { lifecycle: 'DORMANT', dormantAt: new Date() },
		})
	}

	let dismissed = 0
	for (const index of parsed.dismissIndexes ?? []) {
		const candidate = candidates[index]
		if (!candidate || candidate.status !== 'WATCHING') continue
		await prisma.threadCandidate.update({ where: { id: candidate.id }, data: { status: 'DISMISSED' } })
		dismissed++
	}

	return { decayedToDormant: decayed.count, archived, promoted, dismissed }
}

async function promoteCandidate(candidate: ThreadCandidate, promo: PromotionItem) {
	const slug = `${slugify(promo.topicTitleEn ?? candidate.titleEn) || 'thread'}-${Date.now().toString(36)}`
	const topic = await prisma.topic.create({
		data: {
			slug,
			titleZh: toTraditionalZh(promo.topicTitleZh ?? candidate.titleZh),
			titleEn: promo.topicTitleEn ?? candidate.titleEn,
			domain: candidate.domain,
			regions: candidate.regions,
			lifecycle: 'ACTIVE',
			charterWhyZh: promo.charterWhyZh ? toTraditionalZh(promo.charterWhyZh) : null,
			charterWhyEn: promo.charterWhyEn ?? null,
			charterCriteriaZh: promo.charterCriteriaZh ? toTraditionalZh(promo.charterCriteriaZh) : null,
			charterCriteriaEn: promo.charterCriteriaEn ?? null,
			charterActorsZh: (promo.charterActorsZh ?? []).map((a) => toTraditionalZh(a)),
			charterActorsEn: promo.charterActorsEn ?? [],
			lastActivityAt: new Date(),
		},
	})

	// 候選池沒有追蹤實際種子文章（只記標題/訊號，見 design.md 的簡化取捨）；
	// 首個事件排入一般研究佇列，靠完整研究自己的 Google Search 接地從頭查證。
	await prisma.event.create({
		data: {
			slug: `${slugify(candidate.titleEn) || 'event'}-${Date.now().toString(36)}`,
			topicId: topic.id,
			titleZh: candidate.titleZh,
			titleEn: candidate.titleEn,
			domain: candidate.domain,
			regions: candidate.regions,
			importanceScore: 0.7,
			status: 'PENDING_RESEARCH',
		},
	})

	await prisma.threadCandidate.update({
		where: { id: candidate.id },
		data: { status: 'PROMOTED', promotedTopicId: topic.id },
	})
}
