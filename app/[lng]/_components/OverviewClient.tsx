'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { differenceInCalendarDays } from 'date-fns'

import { WorldMap } from './WorldMap'
import { Badge } from '@/components/Badge'
import { LinkPendingSpinner } from '@/components/LinkPendingSpinner'
import { RELIABILITY_VARIANT } from '@/lib/ui'
import { cn } from '@/lib/utils'
import type { RegionKey } from '@/lib/regions'

const SEEN_STORAGE_KEY = 'noise-topic-seen'

interface FacetOption {
	value: string
	label: string
}

export interface TopicCardData {
	slug: string
	title: string
	domain: string
	interval: string
	regions: RegionKey[]
	reliability: string
	reliabilityLabel: string
	regionLabels: string[]
	domainLabel: string
	eventCount: number
	sourceCount: number
	languageCount: number
	updatedAt: string
	spanStartAt: string | null
	spanEndAt: string | null
	latestEventTitles: string[]
}

interface OverviewStats {
	events: string
	sources: string
	languages: string
}

interface OverviewLabels {
	heading: string
	subtitle: string
	interval: string
	domain: string
	region: string
	reliability: string
	updated: string
	empty: string
	stats: OverviewStats
}

interface OverviewClientProps {
	lng: string
	topics: TopicCardData[]
	intervalOptions: FacetOption[]
	domainOptions: FacetOption[]
	regionOptions: FacetOption[]
	reliabilityOptions: FacetOption[]
	labels: OverviewLabels
}

function matchesInterval(selected: string, spanStartAt: string | null, spanEndAt: string | null) {
	if (selected === 'all') return true
	if (!spanEndAt) return false
	const daysSinceEnd = differenceInCalendarDays(new Date(), new Date(spanEndAt))
	if (selected === 'TODAY') return daysSinceEnd <= 1
	if (selected === 'WEEK') return daysSinceEnd <= 7
	if (selected === 'MONTH') return daysSinceEnd <= 31
	const spanDays = spanStartAt ? differenceInCalendarDays(new Date(spanEndAt), new Date(spanStartAt)) : 0
	return spanDays >= 14 && daysSinceEnd <= 7
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
	intervalOptions,
	domainOptions,
	regionOptions,
	reliabilityOptions,
	labels,
}: OverviewClientProps) {
	const [interval, setInterval] = useState('all')
	const [domain, setDomain] = useState('all')
	const [region, setRegion] = useState('all')
	const [reliability, setReliability] = useState('all')
	const [seenMap, setSeenMap] = useState<Record<string, string> | null>(null)

	const filtered = useMemo(
		() =>
			topics.filter(
				(tpc) =>
					matchesInterval(interval, tpc.spanStartAt, tpc.spanEndAt) &&
					(domain === 'all' || tpc.domain === domain) &&
					(region === 'all' || tpc.regions.some((r) => r === region)) &&
					(reliability === 'all' || tpc.reliability === reliability),
			),
		[topics, interval, domain, region, reliability],
	)

	function handleSeen(slug: string, updatedAt: string) {
		setSeenMap((prev) => {
			const next = { ...(prev ?? {}), [slug]: updatedAt }
			localStorage.setItem(SEEN_STORAGE_KEY, JSON.stringify(next))
			return next
		})
	}

	useEffect(() => {
		setSeenMap(readSeenMap())
	}, [])

	return (
		<div className='flex flex-col gap-5'>
			<div>
				<h1 className='text-xl font-medium lg:text-2xl'>{labels.heading}</h1>
				<p className='text-muted-foreground text-sm'>{labels.subtitle}</p>
			</div>

			<div className='flex flex-col gap-5 lg:flex-row lg:items-start lg:gap-8'>
				<aside className='flex flex-col gap-2 lg:sticky lg:top-6 lg:w-48 lg:shrink-0 lg:gap-5'>
					<FacetGroup
						label={labels.interval}
						options={intervalOptions}
						value={interval}
						onChange={setInterval}
					/>
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
					<p className='text-muted-foreground flex-1 py-8 text-center text-sm'>{labels.empty}</p>
				) : (
					<div className='flex min-w-0 flex-1 flex-col gap-3'>
						{filtered.map((tpc) => {
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
					</div>
				)}
			</div>
		</div>
	)
}

function TopicCard({
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
}) {
	const marqueeText = topic.latestEventTitles.join('  ·  ')

	return (
		<Link
			href={`/${lng}/topic/${topic.slug}`}
			onClick={() => onSeen(topic.slug, topic.updatedAt)}
			className={cn(
				'group relative flex flex-col gap-3 rounded-lg border p-4 backdrop-blur-md transition-all duration-200 hover:scale-[1.01]',
				isUnseen
					? 'border-primary/40 bg-primary/5 hover:border-primary/60 hover:bg-primary/10'
					: 'border-border/80 bg-card/70 hover:border-primary/40 hover:bg-card',
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
						<Badge variant={RELIABILITY_VARIANT[topic.reliability] ?? 'muted'} className='shrink-0'>
							{topic.reliabilityLabel}
						</Badge>
					</div>
					<div className='flex flex-wrap gap-1.5'>
						<span className='bg-secondary/60 text-muted-foreground rounded-lg px-2 py-0.5 text-xs backdrop-blur-sm'>
							{topic.domainLabel}
						</span>
						{topic.regionLabels.map((rl) => (
							<span
								key={rl}
								className='bg-secondary/60 text-muted-foreground rounded-lg px-2 py-0.5 text-xs backdrop-blur-sm'
							>
								{rl}
							</span>
						))}
					</div>
					<div className='text-muted-foreground text-xs'>
						{topic.eventCount} {stats.events} · {topic.sourceCount} {stats.sources} · {topic.languageCount}{' '}
						{stats.languages}
					</div>
				</div>
				<div className='border-border bg-secondary/30 w-full shrink-0 overflow-hidden rounded-lg border p-1 backdrop-blur-sm sm:w-80'>
					<WorldMap activeRegions={topic.regions} />
				</div>
			</div>
			{marqueeText ? (
				<div className='border-border/60 bg-card/80 text-muted-foreground absolute inset-x-0 bottom-0 overflow-hidden rounded-b-lg border-t px-4 py-1 text-xs backdrop-blur-sm'>
					<div className='animate-marquee flex w-max'>
						<span className='pr-16'>{marqueeText}</span>
						<span className='pr-16'>{marqueeText}</span>
					</div>
				</div>
			) : null}
		</Link>
	)
}

function FacetGroup({
	label,
	options,
	value,
	onChange,
}: {
	label: string
	options: FacetOption[]
	value: string
	onChange: (value: string) => void
}) {
	return (
		<div className='flex items-center gap-2 lg:flex-col lg:items-start'>
			<span className='text-muted-foreground w-14 shrink-0 text-xs lg:w-auto'>{label}</span>
			<div className='flex min-w-0 gap-1.5 overflow-x-auto lg:flex-wrap lg:overflow-visible'>
				{options.map((opt) => (
					<button
						key={opt.value}
						type='button'
						onClick={() => onChange(opt.value)}
						className={cn(
							'border-border shrink-0 cursor-pointer rounded-lg border px-3 py-1 text-xs whitespace-nowrap backdrop-blur-sm transition-colors',
							value === opt.value
								? 'bg-secondary/80 text-foreground'
								: 'bg-card/50 text-muted-foreground hover:text-foreground',
						)}
					>
						{opt.label}
					</button>
				))}
			</div>
		</div>
	)
}
