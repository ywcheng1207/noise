import { z } from 'zod'

/** 爬蟲統一輸出：與 RSS item 對齊,只含標題/連結/摘要/時間,不含全文。 */
export interface CrawledItem {
	title: string
	url: string
	snippet: string | null
	publishedAt: Date | null
}

type CrawlerFn = (sourceUrl: string) => Promise<CrawledItem[]>

const FETCH_TIMEOUT_MS = 15_000

const cnyesResponseSchema = z.object({
	items: z.object({
		data: z.array(
			z.object({
				newsId: z.number(),
				title: z.string(),
				summary: z.string().nullish(),
				publishAt: z.number().nullish(),
			}),
		),
	}),
})

const sinaResponseSchema = z.object({
	result: z.object({
		data: z.array(
			z.object({
				title: z.string(),
				url: z.string(),
				intro: z.string().nullish(),
				ctime: z.string().nullish(),
			}),
		),
	}),
})

async function fetchJson(url: string): Promise<unknown> {
	const res = await fetch(url, {
		headers: { 'User-Agent': 'Mozilla/5.0 (compatible; NoiseBot/1.0)' },
		signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
	})
	if (!res.ok) throw new Error(`crawler fetch failed: HTTP ${res.status}`)
	return res.json()
}

function toDateFromUnixSeconds(value: number | null | undefined) {
	return typeof value === 'number' && Number.isFinite(value) ? new Date(value * 1000) : null
}

/** 鉅亨網 newslist API:文章連結由 newsId 組出。 */
async function crawlCnyes(sourceUrl: string): Promise<CrawledItem[]> {
	const parsed = cnyesResponseSchema.parse(await fetchJson(sourceUrl))
	return parsed.items.data.map((item) => ({
		title: item.title,
		url: `https://news.cnyes.com/news/id/${item.newsId}`,
		snippet: item.summary ?? null,
		publishedAt: toDateFromUnixSeconds(item.publishAt),
	}))
}

/** 新浪滾動新聞 API:自帶完整文章 URL 與簡介。 */
async function crawlSina(sourceUrl: string): Promise<CrawledItem[]> {
	const parsed = sinaResponseSchema.parse(await fetchJson(sourceUrl))
	return parsed.result.data.map((item) => ({
		title: item.title,
		url: item.url,
		snippet: item.intro ?? null,
		publishedAt: toDateFromUnixSeconds(Number(item.ctime)),
	}))
}

const CRAWLERS: Record<string, CrawlerFn> = {
	'api.cnyes.com': crawlCnyes,
	'feed.mix.sina.com.cn': crawlSina,
}

/** 依來源 URL 的 host 對應爬蟲;未支援的 host 回 null,由呼叫端決定如何回報。 */
export function getCrawler(sourceUrl: string): CrawlerFn | null {
	try {
		const host = new URL(sourceUrl).hostname
		return CRAWLERS[host] ?? null
	} catch {
		return null
	}
}
