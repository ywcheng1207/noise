import Parser from 'rss-parser'
import { prisma } from '@/lib/prisma'
import { canonicalizeUrl } from '@/lib/utils'
import { getCrawler, type CrawledItem } from '@/lib/pipeline/crawlers'
import type { Source } from '@/lib/generated/prisma'

const parser = new Parser()

async function fetchRssItems(url: string): Promise<CrawledItem[]> {
	const feed = await parser.parseURL(url)
	return feed.items.flatMap((item) =>
		item.link
			? [
					{
						title: item.title ?? '(untitled)',
						url: item.link,
						snippet: item.contentSnippet ?? item.content ?? null,
						publishedAt: item.isoDate ? new Date(item.isoDate) : null,
					},
				]
			: [],
	)
}

async function fetchSourceItems(source: Source): Promise<CrawledItem[]> {
	if (source.type !== 'CRAWLER') return fetchRssItems(source.url)
	const crawler = getCrawler(source.url)
	if (!crawler) throw new Error(`no crawler registered for ${source.url}`)
	return crawler(source.url)
}

/** 從啟用中的來源(RSS 或 CRAWLER)擷取新文章(種子)。只存標題/連結/片段,不存全文。 */
export async function runIngest() {
	const sources = await prisma.source.findMany({
		where: { enabled: true, type: { in: ['RSS', 'CRAWLER'] } },
	})
	let inserted = 0

	for (const source of sources) {
		try {
			const items = await fetchSourceItems(source)
			for (const item of items) {
				const canonicalUrl = canonicalizeUrl(item.url)

				const existing = await prisma.article.findUnique({ where: { canonicalUrl } })
				if (existing) continue

				await prisma.article.create({
					data: {
						sourceId: source.id,
						canonicalUrl,
						title: item.title,
						snippet: item.snippet?.slice(0, 500) || null,
						publishedAt: item.publishedAt,
						language: source.language,
						status: 'NEW',
					},
				})
				inserted++
			}
		} catch (err) {
			console.error('[ingest] source failed:', source.url, err instanceof Error ? err.message : err)
		}
	}

	return { sources: sources.length, inserted }
}
