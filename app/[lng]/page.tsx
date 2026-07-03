import { prisma } from '@/lib/prisma'
import { getT } from '@/i18n'
import { FOCUS_DOMAINS, RELIABILITIES } from '@/lib/enums'
import { REGIONS, REGION_LABELS } from '@/lib/regions'
import { OverviewClient, type TopicCardData } from './_components/OverviewClient'

export const dynamic = 'force-dynamic'

const INTERVAL_KEYS = ['TODAY', 'WEEK', 'MONTH', 'ONGOING']

export default async function OverviewPage({ params }: { params: Promise<{ lng: string }> }) {
	const { lng } = await params
	const { t } = await getT(lng)
	const isZh = lng.startsWith('zh')

	const topics = await prisma.topic.findMany({
		where: { domain: { in: [...FOCUS_DOMAINS] } },
		orderBy: { updatedAt: 'desc' },
		include: {
			events: {
				orderBy: { firstSeenAt: 'desc' },
				take: 3,
				select: { titleZh: true, titleEn: true },
			},
		},
	})

	const cards: TopicCardData[] = topics.map((tp) => ({
		slug: tp.slug,
		title: isZh ? tp.titleZh : tp.titleEn,
		domain: tp.domain,
		interval: tp.interval,
		regions: tp.regions,
		reliability: tp.overallReliability,
		reliabilityLabel: t(`reliability.${tp.overallReliability}`),
		domainLabel: t(`domain.${tp.domain}`),
		regionLabels: tp.regions.map((r) => (isZh ? REGION_LABELS[r].zh : REGION_LABELS[r].en)),
		eventCount: tp.eventCount,
		sourceCount: tp.sourceCount,
		languageCount: tp.languageCount,
		updatedAt: tp.updatedAt.toISOString(),
		spanStartAt: tp.spanStart?.toISOString() ?? null,
		spanEndAt: tp.spanEnd?.toISOString() ?? null,
		latestEventTitles: tp.events.map((ev) => (isZh ? ev.titleZh : ev.titleEn)),
	}))

	const intervalOptions = [
		{ value: 'all', label: t('interval.all') },
		...INTERVAL_KEYS.map((k) => ({ value: k, label: t(`interval.${k}`) })),
	]
	const domainsPresent = new Set(topics.map((tp) => tp.domain))
	const domainOptions = [
		{ value: 'all', label: t('domain.all') },
		...FOCUS_DOMAINS.filter((d) => domainsPresent.has(d)).map((d) => ({
			value: d,
			label: t(`domain.${d}`),
		})),
	]
	const regionsPresent = new Set(topics.flatMap((tp) => tp.regions))
	const regionOptions = [
		{ value: 'all', label: t('region.all') },
		...REGIONS.filter((r) => regionsPresent.has(r)).map((r) => ({
			value: r,
			label: isZh ? REGION_LABELS[r].zh : REGION_LABELS[r].en,
		})),
	]
	const reliabilitiesPresent = new Set(topics.map((tp) => tp.overallReliability))
	const reliabilityOptions = [
		{ value: 'all', label: t('reliability.all') },
		...RELIABILITIES.filter((r) => reliabilitiesPresent.has(r)).map((r) => ({
			value: r,
			label: t(`reliability.${r}`),
		})),
	]

	const labels = {
		heading: t('overview.heading'),
		subtitle: t('overview.subtitle'),
		interval: t('overview.interval'),
		domain: t('overview.domain'),
		region: t('overview.region'),
		reliability: t('overview.reliability'),
		updated: t('overview.updated'),
		empty: t('overview.empty'),
		stats: {
			events: t('stats.events'),
			sources: t('stats.sources'),
			languages: t('stats.languages'),
		},
	}

	return (
		<OverviewClient
			lng={lng}
			topics={cards}
			intervalOptions={intervalOptions}
			domainOptions={domainOptions}
			regionOptions={regionOptions}
			reliabilityOptions={reliabilityOptions}
			labels={labels}
		/>
	)
}
