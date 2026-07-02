import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowRight, Clock, MapPin } from 'lucide-react'
import { prisma } from '@/lib/prisma'
import { getT } from '@/i18n'
import { Badge } from '@/components/Badge'
import { RELIABILITY_VARIANT } from '@/lib/ui'
import { REGION_LABELS } from '@/lib/regions'
import { cn } from '@/lib/utils'

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
							className='bg-secondary text-muted-foreground inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs'
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

			<ol className='border-border relative ml-2 border-l'>
				{topic.events.map((ev) => {
					const isResearching = ev.status !== 'RESEARCHED'
					return (
						<li key={ev.slug} className='mb-5 ml-4'>
							<span
								className={cn(
									'absolute -left-[5px] mt-2 size-2.5 rounded-full',
									isResearching ? 'bg-info animate-pulse' : 'bg-warning',
								)}
							/>
							<Link
								href={`/${lng}/event/${ev.slug}`}
								className={cn(
									'hover:border-foreground/30 block rounded-lg border p-3 transition-colors',
									isResearching ? 'border-info/40 bg-info/5 border-dashed' : 'border-border',
								)}
							>
								<div className='flex items-center justify-between gap-2'>
									<span className='font-medium'>{isZh ? ev.titleZh : ev.titleEn}</span>
									{isResearching ? (
										<Badge variant='info'>
											<Clock className='size-3' />
											{t('event.researching')}
										</Badge>
									) : (
										<Badge variant={RELIABILITY_VARIANT[ev.overallReliability] ?? 'muted'}>
											{t(`reliability.${ev.overallReliability}`)}
										</Badge>
									)}
								</div>
								<span className='text-info mt-1 inline-flex items-center gap-1 text-xs'>
									{t('event.viewEvent')} <ArrowRight className='size-3' />
								</span>
							</Link>
						</li>
					)
				})}
			</ol>
		</div>
	)
}
