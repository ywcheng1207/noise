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
	reliability: string
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

	const filtered = useMemo(
		() =>
			topics.filter(
				(tpc) =>
					(interval === 'all' || tpc.interval === interval) &&
					(domain === 'all' || tpc.domain === domain) &&
					(region === 'all' || tpc.regions.some((r) => r === region)) &&
					(reliability === 'all' || tpc.reliability === reliability),
			),
		[topics, interval, domain, region, reliability],
	)

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
						{filtered.map((tpc) => (
							<TopicCard key={tpc.slug} lng={lng} topic={tpc} stats={labels.stats} />
						))}
					</div>
				)}
			</div>
		</div>
	)
}

function TopicCard({ lng, topic, stats }: { lng: string; topic: TopicCardData; stats: OverviewStats }) {
	return (
		<Link
			href={`/${lng}/topic/${topic.slug}`}
			className='border-border hover:border-foreground/30 flex flex-col gap-3 rounded-xl border p-4 transition-colors sm:flex-row sm:items-center'
		>
			<div className='flex min-w-0 flex-1 flex-col gap-2'>
				<div className='flex items-start justify-between gap-2'>
					<span className='font-medium'>{topic.title}</span>
					<Badge variant={RELIABILITY_VARIANT[topic.reliability] ?? 'muted'}>{topic.reliabilityLabel}</Badge>
				</div>
				<div className='flex flex-wrap gap-1.5'>
					<span className='bg-secondary text-muted-foreground rounded-full px-2 py-0.5 text-xs'>
						{topic.domainLabel}
					</span>
					{topic.regionLabels.map((rl) => (
						<span key={rl} className='bg-secondary text-muted-foreground rounded-full px-2 py-0.5 text-xs'>
							{rl}
						</span>
					))}
				</div>
				<div className='text-muted-foreground text-xs'>
					{topic.eventCount} {stats.events} · {topic.sourceCount} {stats.sources} · {topic.languageCount}{' '}
					{stats.languages}
				</div>
			</div>
			<div className='border-border bg-secondary/40 w-full shrink-0 overflow-hidden rounded-lg border p-1 sm:w-80'>
				<WorldMap activeRegions={topic.regions} />
			</div>
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
							'border-border shrink-0 cursor-pointer rounded-full border px-3 py-1 text-xs whitespace-nowrap transition-colors',
							value === opt.value
								? 'bg-secondary text-foreground'
								: 'text-muted-foreground hover:text-foreground',
						)}
					>
						{opt.label}
					</button>
				))}
			</div>
		</div>
	)
}
