import { notFound } from 'next/navigation'
import { MapPin } from 'lucide-react'
import { prisma } from '@/lib/prisma'
import { getT } from '@/i18n'
import { ReliabilityBadge } from '@/components/ReliabilityBadge'
import { LifecycleBadge } from '@/components/LifecycleBadge'
import { REGION_LABELS } from '@/lib/regions'
import { formatOccurred } from '@/lib/dates'
import { RELIABILITIES } from '@/lib/enums'
import { TopicPageEventsList, type TopicPageEventData } from './_components/TopicPageEventsList'
import { TopicPageCharter, type TopicLinkData } from './_components/TopicPageCharter'

export const dynamic = 'force-dynamic'

export default async function TopicPage({ params }: { params: Promise<{ lng: string; slug: string }> }) {
	const { lng, slug } = await params
	const { t } = await getT(lng)
	const isZh = lng.startsWith('zh')

	const topic = await prisma.topic.findUnique({
		where: { slug },
		include: {
			events: { orderBy: { firstSeenAt: 'desc' } },
			linksFrom: { include: { toTopic: { select: { slug: true, titleZh: true, titleEn: true } } } },
			linksTo: { include: { fromTopic: { select: { slug: true, titleZh: true, titleEn: true } } } },
		},
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

	// 只列出這個議題底下實際出現過的狀態,不是每次都塞滿 5 個標記選項——
	// 大部分議題不會同時涵蓋所有可信度分級。
	const reliabilitiesPresent = new Set(
		topic.events.filter((ev) => ev.status === 'RESEARCHED').map((ev) => ev.overallReliability),
	)
	const hasResearching = topic.events.some((ev) => ev.status !== 'RESEARCHED')
	const eventStatusOptions = [
		...(hasResearching ? [{ value: 'RESEARCHING', label: t('event.researching') }] : []),
		...RELIABILITIES.filter((r) => reliabilitiesPresent.has(r)).map((r) => ({ value: r, label: t(`reliability.${r}`) })),
	]

	const links: TopicLinkData[] = [
		...topic.linksFrom.map((l) => ({
			slug: l.toTopic.slug,
			title: isZh ? l.toTopic.titleZh : l.toTopic.titleEn,
			note: isZh ? l.noteZh : l.noteEn,
		})),
		...topic.linksTo.map((l) => ({
			slug: l.fromTopic.slug,
			title: isZh ? l.fromTopic.titleZh : l.fromTopic.titleEn,
			note: isZh ? l.noteZh : l.noteEn,
		})),
	]

	const hasCharter = Boolean(topic.charterWhyZh || topic.charterCriteriaZh || topic.digestZh)

	return (
		<div className='mx-auto flex w-full max-w-3xl flex-col gap-5'>
			<div>
				<h1 className='text-xl font-medium lg:text-2xl'>{title}</h1>
				<div className='mt-2 flex flex-wrap items-center gap-2'>
					<ReliabilityBadge
						reliability={topic.overallReliability}
						label={t(`reliability.${topic.overallReliability}`)}
					/>
					<LifecycleBadge lifecycle={topic.lifecycle} label={t(`topic.lifecycle.${topic.lifecycle}`)} />
					{topic.regions.map((r) => (
						<span
							key={r}
							className='bg-secondary/60 text-muted-foreground inline-flex items-center gap-1 rounded-lg px-2 py-0.5 text-xs'
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

			{hasCharter ? (
				<TopicPageCharter
					digest={isZh ? topic.digestZh : topic.digestEn}
					why={isZh ? topic.charterWhyZh : topic.charterWhyEn}
					criteria={isZh ? topic.charterCriteriaZh : topic.charterCriteriaEn}
					actors={isZh ? topic.charterActorsZh : topic.charterActorsEn}
					links={links}
					lng={lng}
					labels={{
						digestHeading: t('topic.digestHeading'),
						whyHeading: t('topic.whyHeading'),
						criteriaHeading: t('topic.criteriaHeading'),
						actorsHeading: t('topic.actorsHeading'),
						linksHeading: t('topic.linksHeading'),
					}}
				/>
			) : null}

			<TopicPageEventsList
				lng={lng}
				events={eventData}
				dateBounds={dateBounds}
				statusOptions={eventStatusOptions}
				labels={{
					searchPlaceholder: t('topic.searchPlaceholder'),
					empty: t('topic.searchEmpty'),
					researching: t('event.researching'),
					researchingHint: t('event.researchingHint'),
					viewEvent: t('event.viewEvent'),
					dateRange: t('topic.dateRange'),
					statusLabel: t('topic.eventStatusLabel'),
				}}
			/>
		</div>
	)
}
