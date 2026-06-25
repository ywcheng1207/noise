'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { WorldMap } from './WorldMap'
import { Badge } from '@/components/Badge'
import { RELIABILITY_VARIANT } from '@/lib/ui'
import { cn } from '@/lib/utils'
import type { RegionKey } from '@/lib/regions'

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
	empty: string
	stats: OverviewStats
}

interface OverviewClientProps {
	lng: string
	topics: TopicCardData[]
	intervalOptions: FacetOption[]
	domainOptions: FacetOption[]
	regionOptions: FacetOption[]
	labels: OverviewLabels
}

export function OverviewClient({
	lng,
	topics,
	intervalOptions,
	domainOptions,
	regionOptions,
	labels,
}: OverviewClientProps) {
	const [interval, setInterval] = useState('all')
	const [domain, setDomain] = useState('all')
	const [region, setRegion] = useState('all')

	const filtered = useMemo(
		() =>
			topics.filter(
				(tpc) =>
					(interval === 'all' || tpc.interval === interval) &&
					(domain === 'all' || tpc.domain === domain) &&
					(region === 'all' || tpc.regions.some((r) => r === region)),
			),
		[topics, interval, domain, region],
	)

	return (
		<div className='flex flex-col gap-5'>
			<div>
				<h1 className='text-xl font-medium'>{labels.heading}</h1>
				<p className='text-sm text-muted-foreground'>{labels.subtitle}</p>
			</div>

			<div className='flex flex-col gap-2'>
				<FacetRow label={labels.interval} options={intervalOptions} value={interval} onChange={setInterval} />
				<FacetRow label={labels.domain} options={domainOptions} value={domain} onChange={setDomain} />
				<FacetRow label={labels.region} options={regionOptions} value={region} onChange={setRegion} />
			</div>

			{filtered.length === 0 ? (
				<p className='py-8 text-center text-sm text-muted-foreground'>{labels.empty}</p>
			) : (
				<div className='flex flex-col gap-3'>
					{filtered.map((tpc) => (
						<TopicCard key={tpc.slug} lng={lng} topic={tpc} stats={labels.stats} />
					))}
				</div>
			)}
		</div>
	)
}

function TopicCard({
	lng,
	topic,
	stats,
}: {
	lng: string
	topic: TopicCardData
	stats: OverviewStats
}) {
	return (
		<Link
			href={`/${lng}/topic/${topic.slug}`}
			className='rounded-xl border border-border p-4 transition-colors hover:border-foreground/30'
		>
			<div className='flex items-start justify-between gap-2'>
				<span className='font-medium'>{topic.title}</span>
				<Badge variant={RELIABILITY_VARIANT[topic.reliability] ?? 'muted'}>{topic.reliabilityLabel}</Badge>
			</div>
			<div className='mt-3 flex flex-col gap-3 sm:flex-row sm:items-center'>
				<div className='flex min-w-0 flex-1 flex-col gap-2'>
					<div className='flex flex-wrap gap-1.5'>
						<span className='rounded-full bg-secondary px-2 py-0.5 text-xs text-muted-foreground'>
							{topic.domainLabel}
						</span>
						{topic.regionLabels.map((rl) => (
							<span
								key={rl}
								className='rounded-full bg-secondary px-2 py-0.5 text-xs text-muted-foreground'
							>
								{rl}
							</span>
						))}
					</div>
					<div className='text-xs text-muted-foreground'>
						{topic.eventCount} {stats.events} · {topic.sourceCount} {stats.sources} ·{' '}
						{topic.languageCount} {stats.languages}
					</div>
				</div>
				<div className='w-full shrink-0 overflow-hidden rounded-lg border border-border bg-secondary/40 p-1 sm:w-72'>
					<WorldMap activeRegions={topic.regions} />
				</div>
			</div>
		</Link>
	)
}

function FacetRow({
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
		<div className='flex flex-wrap items-center gap-2'>
			<span className='w-14 shrink-0 text-xs text-muted-foreground'>{label}</span>
			{options.map((opt) => (
				<button
					key={opt.value}
					type='button'
					onClick={() => onChange(opt.value)}
					className={cn(
						'rounded-full border border-border px-3 py-1 text-xs transition-colors',
						value === opt.value
							? 'bg-secondary text-foreground'
							: 'text-muted-foreground hover:text-foreground',
					)}
				>
					{opt.label}
				</button>
			))}
		</div>
	)
}
