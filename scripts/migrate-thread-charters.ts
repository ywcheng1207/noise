/**
 * 一次性資料遷移：把既有議題收斂為帶脈絡憲章的初始脈絡集合。
 * 不重新研究任何既有事件——只合併重複議題、補寫憲章欄位。
 * 執行後建議人工檢視收斂結果，確認合理再視需要重跑或手動調整。
 *
 *   pnpm tsx scripts/migrate-thread-charters.ts
 */
import { prisma } from '@/lib/prisma'
import { MODEL, logAiRun, generateJson } from '@/lib/gemini'
import { toTraditionalZh } from '@/lib/zh'
import { THREAD_CONFIG } from '@/lib/pipeline/config'
import { refreshTopicStats } from '@/lib/pipeline/topics'

interface ThreadDraft {
	keepSlug: string
	mergeSlugs?: string[]
	titleZh?: string
	titleEn?: string
	charterWhyZh: string
	charterWhyEn: string
	charterCriteriaZh: string
	charterCriteriaEn: string
	charterActorsZh?: string[]
	charterActorsEn?: string[]
	digestZh?: string
	digestEn?: string
	lifecycle?: 'ACTIVE' | 'DORMANT'
}

interface MigrationResult {
	threads: ThreadDraft[]
}

async function main() {
	const topics = await prisma.topic.findMany({
		select: {
			id: true,
			slug: true,
			titleZh: true,
			titleEn: true,
			domain: true,
			eventCount: true,
			spanEnd: true,
			_count: { select: { events: true } },
		},
	})
	if (topics.length === 0) {
		console.log('no topics to migrate')
		return
	}

	const list = topics
		.map((t) => {
			const daysSinceUpdate = t.spanEnd
				? Math.floor((Date.now() - t.spanEnd.getTime()) / (24 * 60 * 60 * 1000))
				: '?'
			return `${t.slug} [${t.domain}] (${t._count.events} events, 最後更新 ${daysSinceUpdate} 天前): ${t.titleZh} / ${t.titleEn}`
		})
		.join('\n')

	const system =
		'你負責把一批新聞平台既有的議題收斂為數量精簡（理想落在 12 個上下，可依實際內容微調）、彼此清楚不重疊的「脈絡」，並為每個脈絡起草治理用的憲章。同一條故事線（同一場衝突、同一個政策議程、同一組角力關係）的議題應合併為一個脈絡；內容明顯已經過時、久未更新且無後續的議題，收斂後可標記 DORMANT。中文一律使用正體中文（臺灣用語）。'
	const prompt = `既有議題清單（slug [領域] (事件數, 最後更新)：標題）：\n${list}\n\n每個議題都必須被涵蓋（不是被指定為某脈絡的 keepSlug，就是被列在某脈絡的 mergeSlugs 裡）。為每個收斂後的脈絡給：keepSlug（沿用哪個既有 slug 當代表）、mergeSlugs（併入的其他 slug，若無則空陣列）、charterWhyZh/En（為什麼重要）、charterCriteriaZh/En（收錄判準：以後這條脈絡要收哪些後續發展、不收哪些，讀者會看到這段文字）、charterActorsZh/En（關鍵行為者陣列）、digestZh/En（依現有事件內容給的初始滾動摘要，2-3句）、lifecycle（多數應為 ACTIVE，明顯久未更新且無後續發展的可標 DORMANT）。\n\n只回 JSON：{"threads":[{"keepSlug":"","mergeSlugs":[],"charterWhyZh":"","charterWhyEn":"","charterCriteriaZh":"","charterCriteriaEn":"","charterActorsZh":[],"charterActorsEn":[],"digestZh":"","digestEn":"","lifecycle":"ACTIVE"}]}`

	const { data: parsed, usage } = await generateJson<MigrationResult>({
		model: MODEL.CLUSTER,
		system,
		prompt,
	})
	await logAiRun({ stage: 'CLUSTER', model: MODEL.CLUSTER, usage })

	const bySlug = new Map(topics.map((t) => [t.slug, t]))
	const covered = new Set<string>()
	let merged = 0
	let charterWritten = 0

	for (const thread of parsed.threads ?? []) {
		const keep = bySlug.get(thread.keepSlug)
		if (!keep) {
			console.warn(`skip: keepSlug "${thread.keepSlug}" not found among existing topics`)
			continue
		}
		covered.add(thread.keepSlug)

		for (const mergeSlug of thread.mergeSlugs ?? []) {
			const victim = bySlug.get(mergeSlug)
			if (!victim || victim.id === keep.id) continue
			covered.add(mergeSlug)
			await prisma.event.updateMany({ where: { topicId: victim.id }, data: { topicId: keep.id } })
			await prisma.topic.delete({ where: { id: victim.id } })
			merged++
		}

		await prisma.topic.update({
			where: { id: keep.id },
			data: {
				charterWhyZh: toTraditionalZh(thread.charterWhyZh ?? ''),
				charterWhyEn: thread.charterWhyEn ?? '',
				charterCriteriaZh: toTraditionalZh(thread.charterCriteriaZh ?? ''),
				charterCriteriaEn: thread.charterCriteriaEn ?? '',
				charterActorsZh: (thread.charterActorsZh ?? []).map((a) => toTraditionalZh(a)),
				charterActorsEn: thread.charterActorsEn ?? [],
				digestZh: thread.digestZh ? toTraditionalZh(thread.digestZh) : null,
				digestEn: thread.digestEn ?? null,
				lifecycle: thread.lifecycle === 'DORMANT' ? 'DORMANT' : 'ACTIVE',
				dormantAt: thread.lifecycle === 'DORMANT' ? new Date() : null,
				lastActivityAt: new Date(),
			},
		})
		// 合併會改變 keep 底下的事件集合，region/事件數/來源數等統計要重算（純 DB 聚合，無 AI 成本）。
		await refreshTopicStats(keep.id)
		charterWritten++
	}

	const uncovered = topics.filter((t) => !covered.has(t.slug))
	if (uncovered.length > 0) {
		console.warn(
			`${uncovered.length} topic(s) not covered by migration output, left without a charter (excluded from routing until manually fixed):`,
			uncovered.map((t) => t.slug),
		)
	}

	const activeCount = await prisma.topic.count({ where: { lifecycle: 'ACTIVE' } })
	console.log(
		`done: ${charterWritten} threads charter-written, ${merged} topics merged away, ${activeCount} ACTIVE threads (cap: ${THREAD_CONFIG.ACTIVE_THREAD_CAP})`,
	)
	if (activeCount > THREAD_CONFIG.ACTIVE_THREAD_CAP) {
		console.warn(
			`ACTIVE count exceeds cap — next editorial meeting run will force the oldest ones to DORMANT, or manually review now`,
		)
	}
}

main()
	.catch((err) => {
		console.error(err)
		process.exitCode = 1
	})
	.finally(() => prisma.$disconnect())
