'use client'

import { memo, useCallback, useDeferredValue, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Archive, Loader2, MapPin, SearchX, Telescope } from 'lucide-react'

import { WorldMap } from './WorldMap'
import { DomainTag } from '@/components/DomainTag'
import { FacetGroup, type FacetOption } from '@/components/FacetGroup'
import { LinkPendingSpinner } from '@/components/LinkPendingSpinner'
import { ReliabilityBadge } from '@/components/ReliabilityBadge'
import { LifecycleBadge } from '@/components/LifecycleBadge'
import { SearchInput } from '@/components/SearchInput'
import { matchesKeyword } from '@/lib/search'
import { useIncrementalReveal } from '@/lib/hooks/useIncrementalReveal'
import { cn } from '@/lib/utils'
import type { RegionKey } from '@/lib/regions'

const SEEN_STORAGE_KEY = 'noise-topic-seen'

export interface TopicCardData {
	slug: string
	title: string
	domain: string
	regions: RegionKey[]
	reliability: string
	reliabilityLabel: string
	regionLabels: string[]
	domainLabel: string
	eventCount: number
	sourceCount: number
	languageCount: number
	updatedAt: string
	latestEventTitles: string[]
	lifecycle: string
	lifecycleLabel: string
}

interface OverviewStats {
	events: string
	sources: string
	languages: string
}

interface OverviewLabels {
	domain: string
	region: string
	reliability: string
	updated: string
	empty: string
	searchPlaceholder: string
	showArchived: string
	candidatePool: string
	stats: OverviewStats
}

interface OverviewClientProps {
	lng: string
	topics: TopicCardData[]
	domainOptions: FacetOption[]
	regionOptions: FacetOption[]
	reliabilityOptions: FacetOption[]
	labels: OverviewLabels
}

function readSeenMap(): Record<string, string> {
	try {
		const raw = localStorage.getItem(SEEN_STORAGE_KEY)
		if (!raw) return {}
		const parsed: unknown = JSON.parse(raw)
		if (typeof parsed !== 'object' || parsed === null) return {}
		const result: Record<string, string> = {}
		Object.entries(parsed).forEach(([key, value]) => {
			if (typeof value === 'string') result[key] = value
		})
		return result
	} catch {
		return {}
	}
}

export function OverviewClient({
	lng,
	topics,
	domainOptions,
	regionOptions,
	reliabilityOptions,
	labels,
}: OverviewClientProps) {
	const [domain, setDomain] = useState('all')
	const [region, setRegion] = useState('all')
	const [reliability, setReliability] = useState('all')
	const [keyword, setKeyword] = useState('')
	const [showArchived, setShowArchived] = useState(false)
	const [seenMap, setSeenMap] = useState<Record<string, string> | null>(null)

	const deferredKeyword = useDeferredValue(keyword)

	const filtered = useMemo(
		() =>
			topics.filter(
				(tpc) =>
					(showArchived || tpc.lifecycle !== 'ARCHIVED') &&
					(domain === 'all' || tpc.domain === domain) &&
					(region === 'all' || tpc.regions.some((r) => r === region)) &&
					(reliability === 'all' || tpc.reliability === reliability) &&
					matchesKeyword(deferredKeyword, tpc.title, tpc.domainLabel, ...tpc.regionLabels),
			),
		[topics, domain, region, reliability, showArchived, deferredKeyword],
	)

	const { visibleItems, hasMore, sentinelRef } = useIncrementalReveal(filtered)

	// 穩定的 callback 讓 memo 過的 TopicCard 在搜尋輸入等高頻 re-render 時能真正略過。
	const handleSeen = useCallback((slug: string, updatedAt: string) => {
		setSeenMap((prev) => {
			const next = { ...(prev ?? {}), [slug]: updatedAt }
			localStorage.setItem(SEEN_STORAGE_KEY, JSON.stringify(next))
			return next
		})
	}, [])

	useEffect(() => {
		setSeenMap(readSeenMap())
	}, [])

	return (
		<div className='flex flex-col gap-5'>
			<div className='flex flex-col gap-2 sm:flex-row sm:items-center'>
				<SearchInput
					value={keyword}
					onChange={setKeyword}
					placeholder={labels.searchPlaceholder}
					className='flex-1'
				/>
				<div className='flex shrink-0 items-center gap-2'>
					<Link
						href={`/${lng}/candidates`}
						className='bg-secondary/30 text-muted-foreground hover:bg-secondary/60 hover:text-foreground flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs whitespace-nowrap transition-colors duration-200'
					>
						<Telescope className='size-3.5' />
						{labels.candidatePool}
					</Link>
					<button
						type='button'
						onClick={() => setShowArchived((prev) => !prev)}
						className={cn(
							'flex cursor-pointer items-center gap-1.5 rounded-lg px-3 py-2 text-xs whitespace-nowrap transition-colors duration-200',
							showArchived
								? 'bg-secondary text-foreground'
								: 'bg-secondary/30 text-muted-foreground hover:bg-secondary/60 hover:text-foreground',
						)}
					>
						<Archive className='size-3.5' />
						{labels.showArchived}
					</button>
				</div>
			</div>

			<div className='flex flex-col gap-5 lg:flex-row lg:items-start lg:gap-8'>
				<aside className='flex flex-col gap-2 lg:sticky lg:top-6 lg:w-48 lg:shrink-0 lg:gap-5'>
					<FacetGroup label={labels.domain} options={domainOptions} value={domain} onChange={setDomain} />
					<FacetGroup label={labels.region} options={regionOptions} value={region} onChange={setRegion} />
					<FacetGroup
						label={labels.reliability}
						options={reliabilityOptions}
						value={reliability}
						onChange={setReliability}
					/>
				</aside>

				{filtered.length === 0 ? (
					<div className='flex flex-1 flex-col items-center gap-2 py-8 text-center'>
						<SearchX className='text-muted-foreground/50 size-8' />
						<p className='text-muted-foreground text-sm'>{labels.empty}</p>
					</div>
				) : (
					<div className='flex min-w-0 flex-1 flex-col gap-3'>
						{visibleItems.map((tpc) => {
							const isUnseen = seenMap !== null && (!seenMap[tpc.slug] || seenMap[tpc.slug] < tpc.updatedAt)
							return (
								<TopicCard
									key={tpc.slug}
									lng={lng}
									topic={tpc}
									stats={labels.stats}
									updatedLabel={labels.updated}
									isUnseen={isUnseen}
									onSeen={handleSeen}
								/>
							)
						})}
						{hasMore ? (
							<div ref={sentinelRef} className='flex justify-center py-3'>
								<Loader2 className='text-muted-foreground size-4 animate-spin' />
							</div>
						) : null}
					</div>
				)}
			</div>
		</div>
	)
}

// memo:卡片內含整張世界地圖 SVG(上百個 path),搜尋輸入等高頻 re-render 必須略過未變的卡片。
// content-visibility:auto 讓畫面外的卡片跳過排版/繪製(地圖、跑馬燈動畫都不用畫),捲動才不卡。
const TopicCard = memo(
	({
		lng,
		topic,
		stats,
		updatedLabel,
		isUnseen = false,
		onSeen,
	}: {
		lng: string
		topic: TopicCardData
		stats: OverviewStats
		updatedLabel: string
		isUnseen?: boolean
		onSeen: (slug: string, updatedAt: string) => void
	}) => {
		const marqueeText = topic.latestEventTitles.join('  ·  ')

		return (
			<Link
				href={`/${lng}/topic/${topic.slug}`}
				onClick={() => onSeen(topic.slug, topic.updatedAt)}
				className={cn(
					'group relative flex flex-col gap-3 rounded-lg p-4 transition-all duration-200 hover:scale-[1.01]',
					'[contain-intrinsic-size:auto_15rem] [content-visibility:auto]',
					isUnseen ? 'bg-primary/10 hover:bg-primary/15' : 'bg-secondary/40 hover:bg-secondary/60',
				)}
			>
				<div className='flex flex-col gap-3 sm:flex-row sm:items-start'>
					<div className='flex min-w-0 flex-1 flex-col gap-2'>
						<div className='flex items-start justify-between gap-2'>
							<span className='flex min-w-0 items-center gap-2 font-medium'>
								{isUnseen ? (
									<span className='relative flex size-2 shrink-0' title={updatedLabel}>
										<span className='bg-primary/60 absolute inline-flex h-full w-full animate-ping rounded-full' />
										<span className='bg-primary relative inline-flex size-2 rounded-full' />
									</span>
								) : null}
								{topic.title}
								<LinkPendingSpinner />
							</span>
							<div className='flex shrink-0 items-center gap-1.5'>
								<LifecycleBadge lifecycle={topic.lifecycle} label={topic.lifecycleLabel} />
								<ReliabilityBadge reliability={topic.reliability} label={topic.reliabilityLabel} />
							</div>
						</div>
						<div className='flex flex-wrap gap-1.5'>
							<DomainTag domain={topic.domain} label={topic.domainLabel} />
							{topic.regionLabels.map((rl) => (
								<span
									key={rl}
									className='bg-secondary/60 text-muted-foreground inline-flex items-center gap-1 rounded-lg px-2 py-0.5 text-xs'
								>
									<MapPin className='size-3' />
									{rl}
								</span>
							))}
						</div>
						<div className='text-muted-foreground text-xs'>
							{topic.eventCount} {stats.events} · {topic.sourceCount} {stats.sources} · {topic.languageCount}{' '}
							{stats.languages}
						</div>
					</div>
					<div className='bg-secondary/50 w-full shrink-0 overflow-hidden rounded-lg p-1 sm:w-80'>
						<WorldMap activeRegions={topic.regions} />
					</div>
				</div>
				{marqueeText ? (
					<div className='text-muted-foreground absolute inset-x-0 bottom-0 overflow-hidden rounded-b-lg px-4 py-1 text-xs'>
						<div className='animate-marquee flex w-max'>
							<span className='pr-16'>{marqueeText}</span>
							<span className='pr-16'>{marqueeText}</span>
						</div>
					</div>
				) : null}
			</Link>
		)
	},
)
