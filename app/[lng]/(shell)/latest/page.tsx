import { prisma } from '@/lib/prisma'
import { getT } from '@/i18n'
import { formatDateTime } from '@/lib/dates'
import { languageLabel } from '@/lib/languages'
import { LatestArticlesList, type LatestArticleData, type LatestArticleLink } from './_components/LatestArticlesList'

export const dynamic = 'force-dynamic'

export default async function LatestPage({ params }: { params: Promise<{ lng: string }> }) {
	const { lng } = await params
	const { t } = await getT(lng)
	const isZh = lng.startsWith('zh')

	const articles = await prisma.article.findMany({
		where: { highlightRank: { not: null } },
		orderBy: { highlightRank: 'asc' },
		include: {
			source: { select: { name: true } },
			event: {
				select: {
					titleZh: true,
					titleEn: true,
					topic: {
						select: { slug: true, titleZh: true, titleEn: true, domain: true, overallReliability: true },
					},
					sources: {
						select: { sourceName: true, language: true, externalUrl: true },
						orderBy: { rank: 'asc' },
					},
				},
			},
		},
	})

	function buildOriginalLinkLabel(language: string | null) {
		return language ? t('latest.originalLinkWithLanguage', { language }) : t('latest.originalLink')
	}

	const rows: LatestArticleData[] = articles.map((article) => {
		const verifiedSources = (article.event?.sources ?? []).map((s) => ({
			name: s.sourceName,
			languageLabel: languageLabel(s.language, lng),
		}))
		const rawSourceLanguage = languageLabel(article.language, lng)

		// 每個查證過的來源語言只挑一則代表連結（已按可信度排序,故取每個語言第一則),
		// 讓讀者能同時看到中文與英文的原文,而不是隨機只留一個。
		const sourcesWithUrl = (article.event?.sources ?? []).filter(
			(s): s is typeof s & { externalUrl: string } => Boolean(s.externalUrl),
		)
		const seenLanguages = new Set<string>()
		const originalLinks: LatestArticleLink[] = []
		for (const s of sourcesWithUrl) {
			const langKey = (s.language ?? '').toLowerCase()
			if (seenLanguages.has(langKey)) continue
			seenLanguages.add(langKey)
			originalLinks.push({ url: s.externalUrl, label: buildOriginalLinkLabel(languageLabel(s.language, lng)) })
		}
		if (originalLinks.length === 0) {
			originalLinks.push({ url: article.canonicalUrl, label: buildOriginalLinkLabel(rawSourceLanguage) })
		}

		const highlightTitle = isZh ? article.highlightTitleZh : article.highlightTitleEn

		return {
			id: article.id,
			rank: article.highlightRank ?? 0,
			title: highlightTitle || article.title,
			originalLinks,
			fetchedAtLabel: formatDateTime({ lng, date: article.fetchedAt }),
			status: article.status,
			why: isZh ? article.highlightWhyZh : article.highlightWhyEn,
			eventTitle: article.event ? (isZh ? article.event.titleZh : article.event.titleEn) : null,
			verifiedSources,
			verifiedSourcesLabel:
				verifiedSources.length > 0 ? t('latest.verifiedSourcesLabel', { count: verifiedSources.length }) : null,
			singleSourceHint:
				verifiedSources.length === 0 && article.source?.name
					? t('latest.singleSourceHint', { name: article.source.name, language: rawSourceLanguage ?? '—' })
					: null,
			topic: article.event?.topic
				? {
						slug: article.event.topic.slug,
						title: isZh ? article.event.topic.titleZh : article.event.topic.titleEn,
						domain: article.event.topic.domain,
						domainLabel: t(`domain.${article.event.topic.domain}`),
						reliability: article.event.topic.overallReliability,
						reliabilityLabel: t(`reliability.${article.event.topic.overallReliability}`),
					}
				: null,
		}
	})

	return (
		<div className='mx-auto flex w-full max-w-3xl flex-col gap-5'>
			<div>
				<h1 className='text-xl font-medium lg:text-2xl'>{t('latest.heading')}</h1>
				<p className='text-muted-foreground mt-1 text-sm leading-6 sm:text-base'>{t('latest.pageIntro')}</p>
			</div>
			<LatestArticlesList
				lng={lng}
				articles={rows}
				labels={{
					empty: t('latest.empty'),
					statusNew: t('latest.statusNew'),
					statusSkipped: t('latest.statusSkipped'),
					eventLabel: t('latest.eventLabel'),
					viewTopic: t('latest.viewTopic'),
					pendingHint: t('latest.pendingHint'),
					skippedHint: t('latest.skippedHint'),
					whyHeading: t('latest.whyHeading'),
				}}
			/>
		</div>
	)
}
