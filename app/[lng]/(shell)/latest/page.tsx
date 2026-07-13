import { prisma } from '@/lib/prisma'
import { getT } from '@/i18n'
import { formatDateTime } from '@/lib/dates'
import { FOCUS_DOMAINS, RELIABILITIES } from '@/lib/enums'
import { REGIONS, REGION_LABELS } from '@/lib/regions'
import { LatestArticlesList, type LatestArticleData } from './_components/LatestArticlesList'

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
						select: {
							slug: true,
							titleZh: true,
							titleEn: true,
							domain: true,
							regions: true,
							overallReliability: true,
						},
					},
				},
			},
		},
	})

	const rows: LatestArticleData[] = articles.map((article) => ({
		id: article.id,
		rank: article.highlightRank ?? 0,
		title: article.title,
		canonicalUrl: article.canonicalUrl,
		sourceName: article.source?.name ?? null,
		fetchedAtLabel: formatDateTime({ lng, date: article.fetchedAt }),
		status: article.status,
		why: isZh ? article.highlightWhyZh : article.highlightWhyEn,
		eventTitle: article.event ? (isZh ? article.event.titleZh : article.event.titleEn) : null,
		topic: article.event?.topic
			? {
					slug: article.event.topic.slug,
					title: isZh ? article.event.topic.titleZh : article.event.topic.titleEn,
					domain: article.event.topic.domain,
					domainLabel: t(`domain.${article.event.topic.domain}`),
					regions: article.event.topic.regions,
					reliability: article.event.topic.overallReliability,
					reliabilityLabel: t(`reliability.${article.event.topic.overallReliability}`),
				}
			: null,
	}))

	const domainsPresent = new Set(rows.flatMap((row) => (row.topic ? [row.topic.domain] : [])))
	const domainOptions = [
		{ value: 'all', label: t('domain.all') },
		...FOCUS_DOMAINS.filter((d) => domainsPresent.has(d)).map((d) => ({ value: d, label: t(`domain.${d}`) })),
	]
	const regionsPresent = new Set(rows.flatMap((row) => row.topic?.regions ?? []))
	const regionOptions = [
		{ value: 'all', label: t('region.all') },
		...REGIONS.filter((r) => regionsPresent.has(r)).map((r) => ({
			value: r,
			label: isZh ? REGION_LABELS[r].zh : REGION_LABELS[r].en,
		})),
	]
	const reliabilitiesPresent = new Set(rows.flatMap((row) => (row.topic ? [row.topic.reliability] : [])))
	const reliabilityOptions = [
		{ value: 'all', label: t('reliability.all') },
		...RELIABILITIES.filter((r) => reliabilitiesPresent.has(r)).map((r) => ({ value: r, label: t(`reliability.${r}`) })),
	]

	return (
		<div className='mx-auto flex w-full max-w-3xl flex-col gap-5'>
			<div>
				<h1 className='text-xl font-medium lg:text-2xl'>{t('latest.heading')}</h1>
				<p className='text-muted-foreground mt-1 text-sm leading-6'>{t('latest.pageIntro')}</p>
			</div>
			<LatestArticlesList
				lng={lng}
				articles={rows}
				domainOptions={domainOptions}
				regionOptions={regionOptions}
				reliabilityOptions={reliabilityOptions}
				labels={{
					empty: t('latest.empty'),
					statusNew: t('latest.statusNew'),
					statusSkipped: t('latest.statusSkipped'),
					eventLabel: t('latest.eventLabel'),
					viewTopic: t('latest.viewTopic'),
					originalLink: t('latest.originalLink'),
					pendingHint: t('latest.pendingHint'),
					skippedHint: t('latest.skippedHint'),
					whyHeading: t('latest.whyHeading'),
					searchPlaceholder: t('latest.searchPlaceholder'),
					domain: t('overview.domain'),
					region: t('overview.region'),
					reliability: t('overview.reliability'),
				}}
			/>
		</div>
	)
}
