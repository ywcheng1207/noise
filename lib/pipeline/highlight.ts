import { prisma } from '@/lib/prisma'
import { MODEL, logAiRun, generateJson } from '@/lib/gemini'
import { isOverDailyBudget } from '@/lib/pipeline/budget'
import { toTraditionalZh } from '@/lib/zh'

const CANDIDATE_LIMIT = 150
const MAX_HIGHLIGHTS = 10

interface HighlightItem {
	articleIndex: number
	rank: number
	whyZh?: string
	whyEn?: string
}

interface HighlightResult {
	items: HighlightItem[]
}

async function hasRunToday(): Promise<boolean> {
	const startOfDayUtc = new Date()
	startOfDayUtc.setUTCHours(0, 0, 0, 0)
	const existing = await prisma.aiRun.findFirst({
		where: { stage: 'HIGHLIGHT', createdAt: { gte: startOfDayUtc } },
		select: { id: true },
	})
	return Boolean(existing)
}

/**
 * 精選重點：從最近收集的文章中,由 AI 判斷對全球讀者而言最重要的最多 10 則,
 * 並寫一段「為什麼重要 + 需要哪些背景知識」的說明。設計為每日一次(比照編輯會議的
 * hasRunToday 模式),避免每次手動觸發都重新judge、也避免排名一直抖動。
 */
export async function runHighlight() {
	if (await hasRunToday()) {
		return { highlighted: 0, alreadyRanToday: true }
	}
	if (await isOverDailyBudget()) {
		return { highlighted: 0, skippedByBudget: true }
	}

	const articles = await prisma.article.findMany({
		orderBy: { fetchedAt: 'desc' },
		take: CANDIDATE_LIMIT,
		select: { id: true, title: true },
	})
	if (articles.length === 0) return { highlighted: 0 }

	const articleList = articles.map((a, i) => `${i}. ${a.title}`).join('\n')

	const system =
		'你是新聞編輯,負責從最近收集到的新聞標題中判斷哪些對全球讀者而言最重要,並寫一段深入淺出的導讀,幫助原本不熟悉這個主題的讀者真正理解這則新聞的意義。中文一律使用正體中文(臺灣用語),即使原文標題為簡體或其他語言。'
	const prompt = `【最近收集到的新聞標題清單】(index. 標題)\n${articleList}\n\n從上面的清單中,選出對全球讀者而言最重要的最多 ${MAX_HIGHLIGHTS} 則(可以少於 ${MAX_HIGHLIGHTS} 則;不確定的話寧可少選也不要湊數;如果清單裡真的沒有重要新聞,可以選 0 則)。判斷重要性時考慮:是否牽動多國或重大機構、經濟或安全層面的影響程度、是否會有後續連鎖反應。\n\n對每一則入選的新聞,依重要性由高到低給 rank(從 1 開始,不可重複),並寫一段導讀(中英文都要)。導讀不是條列名詞解釋,而是像一位懂行的朋友引導讀者理解:先用一兩句話講清楚讀者要看懂這則新聞,必須先掌握的整體情勢或前提脈絡(不要逐一解釋專有名詞,而是講清楚「現在的局面是什麼」);接著說明這則消息本身代表什麼、可能對世界帶來什麼影響或後續效應。整段讀完要能讓讀者明白「這件事為什麼值得我花時間關注」。長度約 5-8 句,語氣自然像在解釋給朋友聽,不要條列、不要生硬翻譯腔。\n\n只回 JSON:{"items":[{"articleIndex":0,"rank":1,"whyZh":"","whyEn":""}]}`

	const { data: parsed, usage } = await generateJson<HighlightResult>({ model: MODEL.CLUSTER, system, prompt })
	await logAiRun({ stage: 'HIGHLIGHT', model: MODEL.CLUSTER, usage })

	const items = (parsed.items ?? [])
		.filter((item) => articles[item.articleIndex] && item.whyZh && item.whyEn)
		.slice(0, MAX_HIGHLIGHTS)

	// 每次重新選都是全新的一批,先清空上一輪的標記,避免舊的殘留在清單裡跟新的混在一起。
	await prisma.article.updateMany({
		where: { highlightRank: { not: null } },
		data: { highlightRank: null, highlightWhyZh: null, highlightWhyEn: null, highlightedAt: null },
	})

	const now = new Date()
	await Promise.all(
		items.map((item) =>
			prisma.article.update({
				where: { id: articles[item.articleIndex].id },
				data: {
					highlightRank: item.rank,
					highlightWhyZh: toTraditionalZh(item.whyZh ?? ''),
					highlightWhyEn: item.whyEn ?? '',
					highlightedAt: now,
				},
			}),
		),
	)

	return { highlighted: items.length }
}
