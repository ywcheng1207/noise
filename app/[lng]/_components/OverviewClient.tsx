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

interface OverviewLabels {
	heading: string
	subtitle: string
	interval: string
	domain: string
	region: string
	mapHint: string
	empty: string
	stats: { events: string; sources: string; languages: string }
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
	const [hovered, setHovered] = useState<RegionKey[]>([])

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

			<div className='rounded-lg border border-border bg-secondary/40 p-2'>
				<WorldMap activeRegions={hovered} />
				<p className='px-1 pt-1 text-xs text-muted-foreground'>{labels.mapHint}</p>
			</div>

			{filtered.length === 0 ? (
				<p className='py-8 text-center text-sm text-muted-foreground'>{labels.empty}</p>
			) : (
				<div className='flex flex-col gap-3'>
					{filtered.map((tpc) => (
						<Link
							key={tpc.slug}
							href={`/${lng}/topic/${tpc.slug}`}
							onMouseEnter={() => setHovered(tpc.regions)}
							onMouseLeave={() => setHovered([])}
							className='rounded-xl border border-border p-4 transition-colors hover:border-foreground/30'
						>
							<div className='flex items-start justify-between gap-2'>
								<span className='font-medium'>{tpc.title}</span>
								<Badge variant={RELIABILITY_VARIANT[tpc.reliability] ?? 'muted'}>
									{tpc.reliabilityLabel}
								</Badge>
							</div>
							<div className='mt-2 flex flex-wrap gap-1.5'>
								<span className='rounded-full bg-secondary px-2 py-0.5 text-xs text-muted-foreground'>
									{tpc.domainLabel}
								</span>
								{tpc.regionLabels.map((rl) => (
									<span
										key={rl}
										className='rounded-full bg-secondary px-2 py-0.5 text-xs text-muted-foreground'
									>
										{rl}
									</span>
								))}
							</div>
							<div className='mt-2 text-xs text-muted-foreground'>
								{tpc.eventCount} {labels.stats.events} · {tpc.sourceCount} {labels.stats.sources} ·{' '}
								{tpc.languageCount} {labels.stats.languages}
							</div>
						</Link>
					))}
				</div>
			)}
		</div>
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
