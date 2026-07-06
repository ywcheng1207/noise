import { notFound } from 'next/navigation'
import { MapPin } from 'lucide-react'
import { prisma } from '@/lib/prisma'
import { getT } from '@/i18n'
import { Badge } from '@/components/Badge'
import { RELIABILITY_VARIANT } from '@/lib/ui'
import { REGION_LABELS } from '@/lib/regions'
import { formatOccurred } from '@/lib/dates'
import { TopicPageEventsList, type TopicPageEventData } from './_components/TopicPageEventsList'

export const dynamic = 'force-dynamic'

export default async function TopicPage({ params }: { params: Promise<{ lng: string; slug: string }> }) {
	const { lng, slug } = await params
	const { t } = await getT(lng)
	const isZh = lng.startsWith('zh')

	const topic = await prisma.topic.findUnique({
		where: { slug },
		include: { events: { orderBy: { firstSeenAt: 'desc' } } },
	})
	if (!topic) notFound()

	const title = isZh ? topic.titleZh : topic.titleEn
	const dateBounds =
		topic.spanStart && topic.spanEnd
			? { from: topic.spanStart.toISOString().slice(0, 10), to: topic.spanEnd.toISOString().slice(0, 10) }
			: null

	const eventData: TopicPageEventData[] = topic.events.map((ev) => ({
		slug: ev.slug,
		title: isZh ? ev.titleZh : ev.titleEn,
		isResearching: ev.status !== 'RESEARCHED',
		reliability: ev.overallReliability,
		reliabilityLabel: t(`reliability.${ev.overallReliability}`),
		seenLabel: formatOccurred({ lng, occurredAt: ev.firstSeenAt }),
		seenAt: ev.firstSeenAt.toISOString(),
	}))

	return (
		<div className='mx-auto flex w-full max-w-3xl flex-col gap-5'>
			<div>
				<h1 className='text-2xl font-medium'>{title}</h1>
				<div className='mt-2 flex flex-wrap items-center gap-2'>
					<Badge variant={RELIABILITY_VARIANT[topic.overallReliability] ?? 'muted'}>
						{t(`reliability.${topic.overallReliability}`)}
					</Badge>
					{topic.regions.map((r) => (
						<span
							key={r}
							className='bg-secondary/60 text-muted-foreground inline-flex items-center gap-1 rounded-lg px-2 py-0.5 text-xs backdrop-blur-sm'
						>
							<MapPin className='size-3' />
							{isZh ? REGION_LABELS[r].zh : REGION_LABELS[r].en}
						</span>
					))}
					<span className='text-muted-foreground text-xs'>
						{topic.eventCount} {t('stats.events')} · {topic.sourceCount} {t('stats.sources')}
					</span>
				</div>
				<p className='text-muted-foreground mt-2 text-sm'>{t('topic.spread')}</p>
			</div>

			<TopicPageEventsList
				lng={lng}
				events={eventData}
				dateBounds={dateBounds}
				labels={{
					searchPlaceholder: t('topic.searchPlaceholder'),
					empty: t('topic.searchEmpty'),
					researching: t('event.researching'),
					researchingHint: t('event.researchingHint'),
					viewEvent: t('event.viewEvent'),
					dateRange: t('topic.dateRange'),
				}}
			/>
		</div>
	)
}
