import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, ArrowRight, MapPin } from 'lucide-react'
import { prisma } from '@/lib/prisma'
import { getT } from '@/i18n'
import { Badge } from '@/components/Badge'
import { RELIABILITY_VARIANT } from '@/lib/ui'
import { REGION_LABELS } from '@/lib/regions'

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

	return (
		<div className='flex flex-col gap-5'>
			<Link
				href={`/${lng}`}
				className='inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground'
			>
				<ArrowLeft className='size-4' /> {t('topic.backToOverview')}
			</Link>

			<div>
				<h1 className='text-2xl font-medium'>{title}</h1>
				<div className='mt-2 flex flex-wrap items-center gap-2'>
					<Badge variant={RELIABILITY_VARIANT[topic.overallReliability] ?? 'muted'}>
						{t(`reliability.${topic.overallReliability}`)}
					</Badge>
					{topic.regions.map((r) => (
						<span
							key={r}
							className='inline-flex items-center gap-1 rounded-full bg-secondary px-2 py-0.5 text-xs text-muted-foreground'
						>
							<MapPin className='size-3' />
							{isZh ? REGION_LABELS[r].zh : REGION_LABELS[r].en}
						</span>
					))}
					<span className='text-xs text-muted-foreground'>
						{topic.eventCount} {t('stats.events')} · {topic.sourceCount} {t('stats.sources')}
					</span>
				</div>
				<p className='mt-2 text-sm text-muted-foreground'>{t('topic.spread')}</p>
			</div>

			<ol className='relative ml-2 border-l border-border'>
				{topic.events.map((ev) => (
					<li key={ev.slug} className='mb-5 ml-4'>
						<span className='absolute -left-[5px] mt-2 size-2.5 rounded-full bg-warning' />
						<Link
							href={`/${lng}/event/${ev.slug}`}
							className='block rounded-lg border border-border p-3 transition-colors hover:border-foreground/30'
						>
							<div className='flex items-center justify-between gap-2'>
								<span className='font-medium'>{isZh ? ev.titleZh : ev.titleEn}</span>
								<Badge variant={RELIABILITY_VARIANT[ev.overallReliability] ?? 'muted'}>
									{t(`reliability.${ev.overallReliability}`)}
								</Badge>
							</div>
							<span className='mt-1 inline-flex items-center gap-1 text-xs text-info'>
								{t('event.viewEvent')} <ArrowRight className='size-3' />
							</span>
						</Link>
					</li>
				))}
			</ol>
		</div>
	)
}
