'use client'

import { useDeferredValue, useMemo, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, Clock, Loader2 } from 'lucide-react'

import { Badge } from '@/components/Badge'
import { LinkPendingSpinner } from '@/components/LinkPendingSpinner'
import { SearchInput } from '@/components/SearchInput'
import { DateRangePicker, type DateRangeValue } from '@/components/DateRangePicker'
import { RELIABILITY_VARIANT } from '@/lib/ui'
import { matchesKeyword } from '@/lib/search'
import { useIncrementalReveal } from '@/lib/hooks/useIncrementalReveal'
import { cn } from '@/lib/utils'

export interface TopicPageEventData {
	slug: string
	title: string
	isResearching: boolean
	reliability: string
	reliabilityLabel: string
	seenLabel: string | null
	seenAt: string
}

interface TopicPageEventsListProps {
	lng: string
	events: TopicPageEventData[]
	dateBounds: DateRangeValue | null
	labels: {
		searchPlaceholder: string
		empty: string
		researching: string
		researchingHint: string
		viewEvent: string
		dateRange: string
	}
}

export function TopicPageEventsList({ lng, events, dateBounds, labels }: TopicPageEventsListProps) {
	const [keyword, setKeyword] = useState('')
	const [dateRange, setDateRange] = useState<DateRangeValue>(dateBounds ?? { from: '', to: '' })
	const deferredKeyword = useDeferredValue(keyword)

	const filtered = useMemo(
		() =>
			events.filter((ev) => {
				const day = ev.seenAt.slice(0, 10)
				if (dateRange.from && day < dateRange.from) return false
				if (dateRange.to && day > dateRange.to) return false
				return matchesKeyword(deferredKeyword, ev.title)
			}),
		[events, deferredKeyword, dateRange],
	)

	const { visibleItems, hasMore, sentinelRef } = useIncrementalReveal(filtered)

	return (
		<div className='flex flex-col gap-4'>
			<SearchInput value={keyword} onChange={setKeyword} placeholder={labels.searchPlaceholder} />

			{dateBounds ? (
				<DateRangePicker
					lng={lng}
					label={labels.dateRange}
					value={dateRange}
					bounds={dateBounds}
					onChange={setDateRange}
				/>
			) : null}

			{filtered.length === 0 ? (
				<p className='text-muted-foreground py-8 text-center text-sm'>{labels.empty}</p>
			) : (
				<>
					<ol className='border-border relative ml-2 border-l'>
						{visibleItems.map((ev) => (
							<li key={ev.slug} className='mb-5 ml-4'>
								<span
									className={cn(
										'absolute -left-[5px] mt-2 size-2.5 rounded-full',
										ev.isResearching ? 'bg-info animate-pulse' : 'bg-warning',
									)}
								/>
								{ev.isResearching ? (
									<div className='bg-info/10 block rounded-lg p-3 backdrop-blur-md'>
										<div className='flex items-center justify-between gap-2'>
											<span className='font-medium'>{ev.title}</span>
											<Badge variant='info'>
												<Clock className='size-3' />
												{labels.researching}
											</Badge>
										</div>
										<div className='mt-1 flex flex-wrap items-center justify-between gap-2'>
											<span className='text-muted-foreground text-xs'>{labels.researchingHint}</span>
											{ev.seenLabel ? (
												<span className='text-muted-foreground font-mono text-xs'>{ev.seenLabel}</span>
											) : null}
										</div>
									</div>
								) : (
									<Link
										href={`/${lng}/event/${ev.slug}`}
										className='bg-card/90 hover:bg-card block rounded-lg p-3 backdrop-blur-md transition-all duration-200 hover:scale-[1.01]'
									>
										<div className='flex items-center justify-between gap-2'>
											<span className='font-medium'>{ev.title}</span>
											<Badge variant={RELIABILITY_VARIANT[ev.reliability] ?? 'muted'}>
												{ev.reliabilityLabel}
											</Badge>
										</div>
										<div className='mt-1 flex flex-wrap items-center justify-between gap-2'>
											<span className='text-info inline-flex items-center gap-1 text-xs'>
												{labels.viewEvent} <ArrowRight className='size-3' />
												<LinkPendingSpinner />
											</span>
											{ev.seenLabel ? (
												<span className='text-muted-foreground font-mono text-xs'>{ev.seenLabel}</span>
											) : null}
										</div>
									</Link>
								)}
							</li>
						))}
					</ol>
					{hasMore ? (
						<div ref={sentinelRef} className='flex justify-center py-3'>
							<Loader2 className='text-muted-foreground size-4 animate-spin' />
						</div>
					) : null}
				</>
			)}
		</div>
	)
}
