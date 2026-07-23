'use client'

import { memo, useState } from 'react'
import Link from 'next/link'
import { ChevronDown, ExternalLink, SearchX } from 'lucide-react'

import { DomainTag } from '@/components/DomainTag'
import { LinkPendingSpinner } from '@/components/LinkPendingSpinner'
import { ReliabilityBadge } from '@/components/ReliabilityBadge'
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { useIsMobile } from '@/lib/hooks/useIsMobile'
import { cn } from '@/lib/utils'

export interface LatestArticleTopic {
	slug: string
	title: string
	domain: string
	domainLabel: string
	reliability: string
	reliabilityLabel: string
}

export interface LatestArticleSource {
	name: string
	languageLabel: string | null
}

export interface LatestArticleLink {
	url: string
	label: string
}

export interface LatestArticleData {
	id: string
	rank: number
	title: string
	originalLinks: LatestArticleLink[]
	fetchedAtLabel: string | null
	status: 'NEW' | 'CLUSTERED' | 'SKIPPED'
	why: string | null
	eventTitle: string | null
	verifiedSources: LatestArticleSource[]
	verifiedSourcesLabel: string | null
	singleSourceHint: string | null
	topic: LatestArticleTopic | null
}

interface LatestArticlesListLabels {
	empty: string
	statusNew: string
	statusSkipped: string
	eventLabel: string
	viewTopic: string
	pendingHint: string
	skippedHint: string
	whyHeading: string
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
			{articles.map((article) => (
				<LatestArticleRow key={article.id} lng={lng} article={article} labels={labels} />
			))}
		</div>
	)
}

const LatestArticleRow = memo(
	({ lng, article, labels }: { lng: string; article: LatestArticleData; labels: LatestArticlesListLabels }) => {
		const [isOpen, setIsOpen] = useState(false)
		const isMobile = useIsMobile()

		function handleToggle() {
			setIsOpen((prev) => !prev)
		}

		const header = (
			<div className='flex min-w-0 flex-1 gap-2.5'>
				<span className='bg-primary/10 text-primary mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold'>
					{article.rank}
				</span>
				<div className='flex min-w-0 flex-1 flex-col gap-1.5'>
					<span className='min-w-0 truncate font-medium'>{article.title}</span>
					<ArticleTags article={article} labels={labels} />
				</div>
			</div>
		)

		// 手機螢幕太窄,收折後的內容(來源、為什麼重要、原文連結)會被壓成一長條不易閱讀,
		// 改成點擊後彈全螢幕 Dialog 顯示;桌機維持原本的行內收折,方便同時比對多筆展開內容。
		if (isMobile) {
			return (
				<Dialog open={isOpen} onOpenChange={setIsOpen}>
					<DialogTrigger asChild>
						<button
							type='button'
							className='bg-secondary/40 hover:bg-secondary/60 flex w-full cursor-pointer items-start justify-between gap-3 rounded-lg p-3 text-left transition-colors duration-200'
						>
							{header}
							<ChevronDown className='text-muted-foreground mt-0.5 size-4 shrink-0' />
						</button>
					</DialogTrigger>
					<DialogContent
						showCloseButton
						className='top-0 left-0 h-full max-h-full w-full max-w-full translate-x-0 translate-y-0 gap-3 overflow-y-auto rounded-none border-0 p-4'
					>
						<DialogTitle className='pr-6 text-left text-base font-medium'>{article.title}</DialogTitle>
						<ArticleTags article={article} labels={labels} />
						<ArticleDetailContent lng={lng} article={article} labels={labels} className='pl-0' />
					</DialogContent>
				</Dialog>
			)
		}

		return (
			<div className='bg-secondary/40 hover:bg-secondary/60 rounded-lg transition-colors duration-200'>
				<button
					type='button'
					onClick={handleToggle}
					className='flex w-full cursor-pointer items-start justify-between gap-3 p-3 text-left'
				>
					{header}
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
								'transition-opacity duration-300',
								isOpen ? 'opacity-100 delay-100' : 'opacity-0',
							)}
						>
							<ArticleDetailContent lng={lng} article={article} labels={labels} className='px-3 pb-3 pl-[42px]' />
						</div>
					</div>
				</div>
			</div>
		)
	},
)

function ArticleTags({ article, labels }: { article: LatestArticleData; labels: LatestArticlesListLabels }) {
	return (
		<div className='flex flex-wrap items-center gap-1.5'>
			{article.topic ? (
				<>
					<DomainTag domain={article.topic.domain} label={article.topic.domainLabel} />
					<ReliabilityBadge reliability={article.topic.reliability} label={article.topic.reliabilityLabel} />
				</>
			) : (
				<StatusTag article={article} labels={labels} />
			)}
			{article.fetchedAtLabel ? (
				<span className='text-muted-foreground font-mono text-xs'>{article.fetchedAtLabel}</span>
			) : null}
		</div>
	)
}

function ArticleDetailContent({
	lng,
	article,
	labels,
	className,
}: {
	lng: string
	article: LatestArticleData
	labels: LatestArticlesListLabels
	className?: string
}) {
	return (
		<div className={cn('flex flex-col gap-2 text-sm', className)}>
			{article.verifiedSources.length > 0 ? (
				<div className='flex flex-col gap-1'>
					<span className='text-muted-foreground text-xs'>{article.verifiedSourcesLabel}</span>
					<div className='flex flex-wrap gap-1.5'>
						{article.verifiedSources.map((source) => (
							<span key={source.name} className='bg-secondary/60 text-muted-foreground rounded-lg px-2 py-0.5 text-xs'>
								{source.name}
								{source.languageLabel ? ` · ${source.languageLabel}` : ''}
							</span>
						))}
					</div>
				</div>
			) : article.singleSourceHint ? (
				<span className='text-muted-foreground text-xs'>{article.singleSourceHint}</span>
			) : null}
			{article.why ? (
				<div className='flex flex-col gap-1'>
					<span className='text-xs font-medium'>{labels.whyHeading}</span>
					<p className='text-muted-foreground leading-relaxed'>{article.why}</p>
				</div>
			) : null}
			{article.status === 'CLUSTERED' && article.eventTitle ? (
				<span className='text-muted-foreground text-xs'>
					{labels.eventLabel}：{article.eventTitle}
				</span>
			) : null}
			{article.status === 'NEW' ? <p className='text-muted-foreground text-xs'>{labels.pendingHint}</p> : null}
			{article.status === 'SKIPPED' ? <p className='text-muted-foreground text-xs'>{labels.skippedHint}</p> : null}
			<div className='flex flex-wrap items-center gap-3 pt-1'>
				{article.originalLinks.map((link) => (
					<a
						key={link.url}
						href={link.url}
						target='_blank'
						rel='noopener noreferrer'
						className='text-info inline-flex items-center gap-1 text-xs hover:underline'
					>
						<ExternalLink className='size-3' />
						{link.label}
					</a>
				))}
				{article.topic ? (
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
	)
}

function StatusTag({ article, labels }: { article: LatestArticleData; labels: LatestArticlesListLabels }) {
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
