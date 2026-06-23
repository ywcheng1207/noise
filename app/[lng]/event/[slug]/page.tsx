import { notFound } from 'next/navigation'
import Link from 'next/link'
import { AlertTriangle, ArrowLeft, ExternalLink, ShieldCheck } from 'lucide-react'
import { prisma } from '@/lib/prisma'
import { getT } from '@/i18n'
import { Badge } from '@/components/Badge'
import { RELIABILITY_VARIANT, TIER_VARIANT } from '@/lib/ui'
import { cn } from '@/lib/utils'

export const dynamic = 'force-dynamic'

export default async function EventPage({ params }: { params: Promise<{ lng: string; slug: string }> }) {
	const { lng, slug } = await params
	const { t } = await getT(lng)
	const isZh = lng.startsWith('zh')

	const event = await prisma.event.findUnique({
		where: { slug },
		include: {
			topic: true,
			timeline: { orderBy: [{ rank: 'asc' }, { occurredAt: 'asc' }] },
			sources: { orderBy: { rank: 'asc' } },
		},
	})
	if (!event) notFound()

	const title = isZh ? event.titleZh : event.titleEn
	const narrative = isZh ? event.narrativeZh : event.narrativeEn
	const backHref = event.topic ? `/${lng}/topic/${event.topic.slug}` : `/${lng}`

	return (
		<div className='flex flex-col gap-6'>
			<Link
				href={backHref}
				className='inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground'
			>
				<ArrowLeft className='size-4' /> {event.topic ? t('event.backToTopic') : t('topic.backToOverview')}
			</Link>

			<div>
				<h1 className='text-2xl font-medium'>{title}</h1>
				<div className='mt-2'>
					<Badge variant={RELIABILITY_VARIANT[event.overallReliability] ?? 'muted'}>
						{t(`reliability.${event.overallReliability}`)}
					</Badge>
				</div>
			</div>

			{narrative && (
				<section>
					<h2 className='mb-2 text-sm font-medium text-muted-foreground'>{t('event.background')}</h2>
					<p className='text-[15px] leading-7'>{narrative}</p>
				</section>
			)}

			{event.timeline.length > 0 && (
				<section>
					<h2 className='mb-3 text-sm font-medium text-muted-foreground'>{t('event.timeline')}</h2>
					<ol className='relative ml-2 border-l border-border'>
						{event.timeline.map((node) => (
							<li key={node.id} className='mb-4 ml-4'>
								<span
									className={cn(
										'absolute -left-[5px] mt-1.5 size-2.5 rounded-full',
										node.isConflicting ? 'bg-warning' : 'bg-info',
									)}
								/>
								<div className='font-mono text-xs text-muted-foreground'>{node.occurredLabel ?? ''}</div>
								<div className='text-sm leading-6'>{isZh ? node.descZh : node.descEn}</div>
								<div className='mt-1 flex flex-wrap items-center gap-2'>
									{node.isConflicting && (
										<Badge variant='warning'>
											<AlertTriangle className='size-3' />
											{t('event.conflicting')}
										</Badge>
									)}
									{node.sourceLabel &&
										(node.sourceUrl ? (
											<a className='text-xs text-info underline' href={node.sourceUrl}>
												{node.sourceLabel}
											</a>
										) : (
											<span className='text-xs text-muted-foreground'>{node.sourceLabel}</span>
										))}
								</div>
							</li>
						))}
					</ol>
				</section>
			)}

			{event.sources.length > 0 && (
				<section>
					<h2 className='mb-3 text-sm font-medium text-muted-foreground'>{t('event.sources')}</h2>
					<ol className='flex flex-col gap-2'>
						{event.sources.map((src) => {
							const reasoning = isZh ? src.reasoningZh : src.reasoningEn
							return (
								<li
									key={src.id}
									className={cn(
										'rounded-lg border p-3',
										src.isAuthoritative ? 'border-info/40 bg-info/5' : 'border-border',
									)}
								>
									<div className='flex items-center justify-between gap-2'>
										<div className='flex items-center gap-2'>
											<span className='text-sm font-medium text-muted-foreground'>{src.rank}</span>
											<span className='font-medium'>{src.sourceName}</span>
										</div>
										<div className='flex items-center gap-2'>
											<Badge variant={TIER_VARIANT[src.credibilityTier] ?? 'muted'}>
												{src.isAuthoritative && <ShieldCheck className='size-3' />}
												{t(`tier.${src.credibilityTier}`)}
											</Badge>
											{src.externalUrl && (
												<a href={src.externalUrl} aria-label='open source' className='text-info'>
													<ExternalLink className='size-4' />
												</a>
											)}
										</div>
									</div>
									{reasoning && (
										<p className='mt-1.5 text-xs leading-5 text-muted-foreground'>
											<span className='text-info'>{t('event.why')}</span> {reasoning}
										</p>
									)}
								</li>
							)
						})}
					</ol>
				</section>
			)}

			<div className='border-t border-border pt-3 text-xs text-muted-foreground'>
				{t('event.disclaimer')}
			</div>
		</div>
	)
}
