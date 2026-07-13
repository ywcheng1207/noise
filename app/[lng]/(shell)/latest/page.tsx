import { prisma } from '@/lib/prisma'
import { getT } from '@/i18n'
import { formatDateTime } from '@/lib/dates'
import { LatestArticlesList, type LatestArticleData } from './_components/LatestArticlesList'

export const dynamic = 'force-dynamic'

const ARTICLE_LIMIT = 150

export default async function LatestPage({ params }: { params: Promise<{ lng: string }> }) {
	const { lng } = await params
	const { t } = await getT(lng)
	const isZh = lng.startsWith('zh')

	const articles = await prisma.article.findMany({
		orderBy: { fetchedAt: 'desc' },
		take: ARTICLE_LIMIT,
		include: {
			source: { select: { name: true } },
			event: {
				select: {
					titleZh: true,
					titleEn: true,
					topic: {
						select: { slug: true, titleZh: true, titleEn: true, domain: true, overallReliability: true },
					},
				},
			},
		},
	})

	const rows: LatestArticleData[] = articles.map((article) => ({
		id: article.id,
		title: article.title,
		canonicalUrl: article.canonicalUrl,
		sourceName: article.source?.name ?? null,
		fetchedAtLabel: formatDateTime({ lng, date: article.fetchedAt }),
		status: article.status,
		eventTitle: article.event ? (isZh ? article.event.titleZh : article.event.titleEn) : null,
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
	}))

	return (
		<div className='mx-auto flex w-full max-w-3xl flex-col gap-5'>
			<div>
				<h1 className='text-xl font-medium lg:text-2xl'>{t('latest.heading')}</h1>
				<p className='text-muted-foreground mt-1 text-sm leading-6'>{t('latest.pageIntro')}</p>
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
					originalLink: t('latest.originalLink'),
					pendingHint: t('latest.pendingHint'),
					skippedHint: t('latest.skippedHint'),
				}}
			/>
		</div>
	)
}
