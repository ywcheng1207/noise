import Link from 'next/link'
import { ExternalLink, Newspaper, Sparkles } from 'lucide-react'
import { prisma } from '@/lib/prisma'
import { getT } from '@/i18n'
import { Collapsible } from '@/components/Collapsible'
import { LinkPendingSpinner } from '@/components/LinkPendingSpinner'
import { formatDateTime, formatOccurred, formatTime } from '@/lib/dates'
import { PipelineStage } from '@/lib/generated/prisma'

export const dynamic = 'force-dynamic'

const NARRATIVE_EXCERPT_LENGTH = 88

function excerpt(text: string | null) {
	if (!text) return null
	return text.length > NARRATIVE_EXCERPT_LENGTH ? `${text.slice(0, NARRATIVE_EXCERPT_LENGTH)}…` : text
}

export default async function LogDayPage({ params }: { params: Promise<{ lng: string; date: string }> }) {
	const { lng, date } = await params
	const { t } = await getT(lng)
	const isZh = lng.startsWith('zh')

	const dayStart = new Date(`${date}T00:00:00.000Z`)
	const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000)

	const [sources, aiRuns] = await Promise.all([
		prisma.source.findMany({ where: { enabled: true }, orderBy: { name: 'asc' } }),
		prisma.aiRun.findMany({
			where: {
				stage: PipelineStage.RESEARCH,
				eventId: { not: null },
				createdAt: { gte: dayStart, lt: dayEnd },
			},
			orderBy: { createdAt: 'desc' },
			select: { id: true, eventId: true, createdAt: true, webSearches: true },
		}),
	])

	const sourceSamples = await Promise.all(
		sources.map((source) =>
			prisma.article.findMany({
				where: { sourceId: source.id, fetchedAt: { gte: dayStart, lt: dayEnd } },
				orderBy: { fetchedAt: 'desc' },
				take: 5,
				select: { title: true, canonicalUrl: true, fetchedAt: true },
			}),
		),
	)
	const activeSources = sources
		.map((source, i) => ({ source, samples: sourceSamples[i] }))
		.filter((row) => row.samples.length > 0)

	const eventIds = aiRuns.map((run) => run.eventId).filter((id): id is string => Boolean(id))
	const events = await prisma.event.findMany({
		where: { id: { in: eventIds } },
		select: { id: true, slug: true, titleZh: true, titleEn: true, narrativeZh: true, narrativeEn: true },
	})
	const eventById = new Map(events.map((ev) => [ev.id, ev]))

	const researchEntries = aiRuns.flatMap((run) => {
		const event = run.eventId ? eventById.get(run.eventId) : undefined
		if (!event) return []
		return [
			{
				id: run.id,
				title: isZh ? event.titleZh : event.titleEn,
				summary: excerpt(isZh ? event.narrativeZh : event.narrativeEn),
				href: `/${lng}/event/${event.slug}?fromLog=${date}`,
				createdAt: run.createdAt,
				webSearches: run.webSearches,
			},
		]
	})

	const dayLabel = formatOccurred({ lng, occurredAt: dayStart, precision: 'DAY' })

	return (
		<div className='mx-auto flex w-full max-w-3xl flex-col gap-8'>
			<div>
				<h1 className='text-xl font-medium lg:text-2xl'>{dayLabel}</h1>
				<p className='text-muted-foreground text-sm'>
					{t('log.summaryLine', {
						articleCount: activeSources.reduce((sum, row) => sum + row.samples.length, 0),
						researchCount: researchEntries.length,
					})}
				</p>
			</div>

			<Collapsible
				title={
					<span className='flex items-center gap-1.5'>
						<Newspaper className='size-4' />
						{t('log.sourcesHeading')}
					</span>
				}
			>
				<div className='flex flex-col gap-2'>
					{activeSources.map(({ source, samples }) => (
						<div key={source.id} className='bg-secondary/40 rounded-lg p-3'>
							<span className='font-medium'>{source.name}</span>
							<ul className='mt-2 flex flex-col gap-1'>
								{samples.map((article) => (
									<li key={article.canonicalUrl}>
										<a
											href={article.canonicalUrl}
											target='_blank'
											rel='noopener noreferrer'
											className='text-info flex items-center gap-1 text-xs hover:underline'
										>
											<ExternalLink className='size-3 shrink-0' />
											<span className='min-w-0 truncate'>{article.title}</span>
											<span className='text-muted-foreground shrink-0 font-mono'>
												{formatTime({ date: article.fetchedAt })}
											</span>
										</a>
									</li>
								))}
							</ul>
						</div>
					))}
				</div>
			</Collapsible>

			<div className='border-border border-t' />

			<Collapsible
				title={
					<span className='flex items-center gap-1.5'>
						<Sparkles className='text-primary size-4' />
						{t('log.aiHeading')}
					</span>
				}
			>
				{researchEntries.length === 0 ? (
					<p className='text-muted-foreground text-sm'>{t('log.aiEmpty')}</p>
				) : (
					<ul className='flex flex-col gap-2'>
						{researchEntries.map((entry) => (
							<li key={entry.id}>
								<Link
									href={entry.href}
									className='bg-secondary/40 hover:bg-secondary/60 block rounded-lg p-3 transition-all duration-200 hover:scale-[1.01]'
								>
									<div className='flex items-center justify-between gap-2'>
										<span className='font-medium'>{entry.title}</span>
										<span className='text-muted-foreground flex shrink-0 items-center gap-1 font-mono text-xs'>
											{formatDateTime({ lng, date: entry.createdAt })}
											<LinkPendingSpinner />
										</span>
									</div>
									{entry.summary ? (
										<p className='text-muted-foreground mt-1 text-xs leading-5'>{entry.summary}</p>
									) : null}
									<span className='text-muted-foreground mt-1 block text-xs'>
										{t('log.webSearches', { count: entry.webSearches })}
									</span>
								</Link>
							</li>
						))}
					</ul>
				)}
			</Collapsible>
		</div>
	)
}
