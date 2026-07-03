import { notFound } from 'next/navigation'
import { AlertTriangle, Clock, ExternalLink, FileText, ShieldCheck, Video } from 'lucide-react'
import { prisma } from '@/lib/prisma'
import { getT } from '@/i18n'
import { Badge } from '@/components/Badge'
import { RELIABILITY_VARIANT, TIER_VARIANT } from '@/lib/ui'
import { formatOccurred } from '@/lib/dates'
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
	const hasContent = Boolean(narrative) || event.timeline.length > 0 || event.sources.length > 0
	const isResearched = event.status === 'RESEARCHED' && hasContent

	return (
		<div className='flex flex-col gap-6'>
			<div>
				<h1 className='text-2xl font-medium'>{title}</h1>
				<div className='mt-2 flex flex-wrap items-center gap-2'>
					<Badge variant={RELIABILITY_VARIANT[event.overallReliability] ?? 'muted'}>
						{t(`reliability.${event.overallReliability}`)}
					</Badge>
					{isResearched ? null : (
						<Badge variant='info'>
							<Clock className='size-3' />
							{t('event.researching')}
						</Badge>
					)}
				</div>
			</div>

			<div className='flex flex-col gap-6 xl:flex-row xl:items-start xl:gap-10'>
				<div className='flex max-w-3xl min-w-0 flex-1 flex-col gap-6'>
					{isResearched ? null : (
						<div className='border-info/50 bg-info/5 text-muted-foreground flex items-center gap-2 rounded-lg border border-dashed p-4 text-sm'>
							<Clock className='text-info size-4 shrink-0 animate-pulse' />
							{t('event.researchingHint')}
						</div>
					)}

					{narrative && (
						<section>
							<h2 className='text-muted-foreground mb-2 text-sm font-medium'>{t('event.background')}</h2>
							<p className='text-[15px] leading-7'>{narrative}</p>
						</section>
					)}

					{event.timeline.length > 0 && (
						<section>
							<h2 className='text-muted-foreground mb-3 text-sm font-medium'>{t('event.timeline')}</h2>
							<ol className='border-border relative ml-2 border-l'>
								{event.timeline.map((node) => {
									const occurred = formatOccurred({
										lng,
										occurredAt: node.occurredAt,
										precision: node.occurredPrecision,
										fallbackLabel: node.occurredLabel,
									})
									return (
										<li key={node.id} className='mb-4 ml-4'>
											<span
												className={cn(
													'absolute -left-[5px] mt-1.5 size-2.5 rounded-full',
													node.isConflicting ? 'bg-warning' : 'bg-info',
												)}
											/>
											<div className='text-muted-foreground font-mono text-xs'>{occurred ?? ''}</div>
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
														<a
															className='text-info text-xs underline'
															href={node.sourceUrl}
															target='_blank'
															rel='noopener noreferrer'
														>
															{node.sourceLabel}
														</a>
													) : (
														<span className='text-muted-foreground text-xs'>{node.sourceLabel}</span>
													))}
											</div>
										</li>
									)
								})}
							</ol>
						</section>
					)}
				</div>

				{event.sources.length > 0 && (
					<section className='min-w-0 xl:sticky xl:top-6 xl:w-96 xl:shrink-0'>
						<h2 className='text-muted-foreground mb-3 text-sm font-medium'>{t('event.sources')}</h2>
						<ol className='flex flex-col gap-2'>
							{event.sources.map((src) => {
								const reasoning = isZh ? src.reasoningZh : src.reasoningEn
								const isVideo = src.mediaType === 'VIDEO'
								return (
									<li
										key={src.id}
										className={cn(
											'rounded-lg border p-3',
											src.isAuthoritative ? 'border-info/40 bg-info/5' : 'border-border',
										)}
									>
										<div className='flex items-center justify-between gap-2'>
											<div className='flex flex-wrap items-center gap-2'>
												<span className='text-muted-foreground text-sm font-medium'>{src.rank}</span>
												<span className='font-medium'>{src.sourceName}</span>
												{src.language ? (
													<span className='bg-secondary text-muted-foreground rounded px-1.5 py-0.5 text-xs uppercase'>
														{src.language}
													</span>
												) : null}
												<span className='bg-secondary text-muted-foreground inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-xs'>
													{isVideo ? <Video className='size-3' /> : <FileText className='size-3' />}
													{isVideo ? t('source.video') : t('source.text')}
												</span>
											</div>
											<div className='flex items-center gap-2'>
												<Badge variant={TIER_VARIANT[src.credibilityTier] ?? 'muted'}>
													{src.isAuthoritative && <ShieldCheck className='size-3' />}
													{t(`tier.${src.credibilityTier}`)}
												</Badge>
												{src.externalUrl && (
													<a
														href={src.externalUrl}
														aria-label='open source'
														className='text-info'
														target='_blank'
														rel='noopener noreferrer'
													>
														<ExternalLink className='size-4' />
													</a>
												)}
											</div>
										</div>
										{reasoning && (
											<p className='text-muted-foreground mt-1.5 text-xs leading-5'>
												<span className='text-info'>{t('event.why')}</span> {reasoning}
											</p>
										)}
									</li>
								)
							})}
						</ol>
					</section>
				)}
			</div>
		</div>
	)
}
