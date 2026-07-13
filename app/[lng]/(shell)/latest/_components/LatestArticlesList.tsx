'use client'

import { memo, useState } from 'react'
import Link from 'next/link'
import { ChevronDown, ExternalLink, SearchX } from 'lucide-react'

import { DomainTag } from '@/components/DomainTag'
import { LinkPendingSpinner } from '@/components/LinkPendingSpinner'
import { ReliabilityBadge } from '@/components/ReliabilityBadge'
import { useIncrementalReveal } from '@/lib/hooks/useIncrementalReveal'
import { cn } from '@/lib/utils'

export interface LatestArticleTopic {
	slug: string
	title: string
	domain: string
	domainLabel: string
	reliability: string
	reliabilityLabel: string
}

export interface LatestArticleData {
	id: string
	title: string
	canonicalUrl: string
	sourceName: string | null
	fetchedAtLabel: string | null
	status: 'NEW' | 'CLUSTERED' | 'SKIPPED'
	eventTitle: string | null
	topic: LatestArticleTopic | null
}

interface LatestArticlesListLabels {
	empty: string
	statusNew: string
	statusSkipped: string
	eventLabel: string
	viewTopic: string
	originalLink: string
	pendingHint: string
	skippedHint: string
}

export const LatestArticlesList = ({
	lng,
	articles,
	labels,
}: {
	lng: string
	articles: LatestArticleData[]
	labels: LatestArticlesListLabels
}) => {
	const { visibleItems, hasMore, sentinelRef } = useIncrementalReveal(articles)

	if (articles.length === 0) {
		return (
			<div className='flex flex-col items-center gap-2 py-8 text-center'>
				<SearchX className='text-muted-foreground/50 size-8' />
				<p className='text-muted-foreground text-sm'>{labels.empty}</p>
			</div>
		)
	}

	return (
		<div className='flex flex-col gap-2'>
			{visibleItems.map((article) => (
				<LatestArticleRow key={article.id} lng={lng} article={article} labels={labels} />
			))}
			{hasMore ? <div ref={sentinelRef} className='h-1' /> : null}
		</div>
	)
}

const LatestArticleRow = memo(
	({ lng, article, labels }: { lng: string; article: LatestArticleData; labels: LatestArticlesListLabels }) => {
		const [isOpen, setIsOpen] = useState(false)

		function handleToggle() {
			setIsOpen((prev) => !prev)
		}

		return (
			<div className='bg-secondary/40 rounded-lg'>
				<button
					type='button'
					onClick={handleToggle}
					className='flex w-full items-start justify-between gap-3 p-3 text-left'
				>
					<div className='flex min-w-0 flex-1 flex-col gap-1.5'>
						<span className='min-w-0 truncate font-medium'>{article.title}</span>
						<div className='flex flex-wrap items-center gap-1.5'>
							<StatusTag article={article} labels={labels} />
							{article.fetchedAtLabel ? (
								<span className='text-muted-foreground font-mono text-xs'>{article.fetchedAtLabel}</span>
							) : null}
						</div>
					</div>
					<ChevronDown
						className={cn(
							'text-muted-foreground mt-0.5 size-4 shrink-0 transition-transform duration-300',
							isOpen && 'rotate-180',
						)}
					/>
				</button>
				<div
					className={cn(
						'grid transition-all duration-300 ease-in-out',
						isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]',
					)}
				>
					<div className='overflow-hidden'>
						<div
							className={cn(
								'flex flex-col gap-2 px-3 pb-3 text-sm transition-opacity duration-300',
								isOpen ? 'opacity-100 delay-100' : 'opacity-0',
							)}
						>
							{article.sourceName ? (
								<span className='text-muted-foreground text-xs'>{article.sourceName}</span>
							) : null}
							{article.status === 'CLUSTERED' && article.topic ? (
								<>
									{article.eventTitle ? (
										<span className='text-muted-foreground text-xs'>
											{labels.eventLabel}：{article.eventTitle}
										</span>
									) : null}
									<div className='flex flex-wrap items-center gap-1.5'>
										<DomainTag domain={article.topic.domain} label={article.topic.domainLabel} />
										<ReliabilityBadge reliability={article.topic.reliability} label={article.topic.reliabilityLabel} />
									</div>
								</>
							) : null}
							{article.status === 'NEW' ? (
								<p className='text-muted-foreground text-xs'>{labels.pendingHint}</p>
							) : null}
							{article.status === 'SKIPPED' ? (
								<p className='text-muted-foreground text-xs'>{labels.skippedHint}</p>
							) : null}
							<div className='flex flex-wrap items-center gap-3 pt-1'>
								<a
									href={article.canonicalUrl}
									target='_blank'
									rel='noopener noreferrer'
									className='text-info inline-flex items-center gap-1 text-xs hover:underline'
								>
									<ExternalLink className='size-3' />
									{labels.originalLink}
								</a>
								{article.status === 'CLUSTERED' && article.topic ? (
									<Link
										href={`/${lng}/topic/${article.topic.slug}`}
										className='text-info inline-flex items-center gap-1 text-xs hover:underline'
									>
										{labels.viewTopic}
										<LinkPendingSpinner />
									</Link>
								) : null}
							</div>
						</div>
					</div>
				</div>
			</div>
		)
	},
)

function StatusTag({ article, labels }: { article: LatestArticleData; labels: LatestArticlesListLabels }) {
	if (article.status === 'CLUSTERED' && article.topic) {
		return (
			<span className='bg-primary/10 text-primary max-w-[14rem] truncate rounded-lg px-2 py-0.5 text-xs'>
				{article.topic.title}
			</span>
		)
	}
	if (article.status === 'NEW') {
		return (
			<span className='border-muted-foreground/40 text-muted-foreground inline-flex items-center rounded-lg border border-dashed px-2 py-0.5 text-xs'>
				{labels.statusNew}
			</span>
		)
	}
	return (
		<span className='bg-secondary/60 text-muted-foreground inline-flex items-center rounded-lg px-2 py-0.5 text-xs'>
			{labels.statusSkipped}
		</span>
	)
}
