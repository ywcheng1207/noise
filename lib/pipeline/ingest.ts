import Parser from 'rss-parser'
import { prisma } from '@/lib/prisma'
import { canonicalizeUrl } from '@/lib/utils'

const parser = new Parser()

/** 從啟用中的 RSS 來源擷取新文章（種子）。只存標題/連結/片段，不存全文。 */
export async function runIngest() {
	const sources = await prisma.source.findMany({ where: { enabled: true, type: 'RSS' } })
	let inserted = 0

	for (const source of sources) {
		try {
			const feed = await parser.parseURL(source.url)
			for (const item of feed.items) {
				if (!item.link) continue
				const canonicalUrl = canonicalizeUrl(item.link)

				const existing = await prisma.article.findUnique({ where: { canonicalUrl } })
				if (existing) continue

				await prisma.article.create({
					data: {
						sourceId: source.id,
						canonicalUrl,
						title: item.title ?? '(untitled)',
						snippet: (item.contentSnippet ?? item.content ?? '').slice(0, 500) || null,
						publishedAt: item.isoDate ? new Date(item.isoDate) : null,
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
