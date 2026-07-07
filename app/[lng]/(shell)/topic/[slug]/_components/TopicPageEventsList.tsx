'use client'

import { memo, useDeferredValue, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, Clock, SearchX } from 'lucide-react'
import { useVirtualizer } from '@tanstack/react-virtual'

import { Badge } from '@/components/Badge'
import { LinkPendingSpinner } from '@/components/LinkPendingSpinner'
import { ReliabilityBadge } from '@/components/ReliabilityBadge'
import { SearchInput } from '@/components/SearchInput'
import { DateRangePicker, type DateRangeValue } from '@/components/DateRangePicker'
import { useScrollContainerRef } from '@/components/ScrollContainerContext'
import { matchesKeyword } from '@/lib/search'
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

interface EventTimelineLabels {
	researching: string
	researchingHint: string
	viewEvent: string
}

interface TopicPageEventsListProps {
	lng: string
	events: TopicPageEventData[]
	dateBounds: DateRangeValue | null
	labels: EventTimelineLabels & {
		searchPlaceholder: string
		empty: string
		dateRange: string
	}
}

const ESTIMATED_ROW_HEIGHT = 92
const OVERSCAN = 6

export function TopicPageEventsList({ lng, events, dateBounds, labels }: TopicPageEventsListProps) {
	const [keyword, setKeyword] = useState('')
	const [dateRange, setDateRange] = useState<DateRangeValue>(dateBounds ?? { from: '', to: '' })
	const deferredKeyword = useDeferredValue(keyword)
	const scrollContainerRef = useScrollContainerRef()

	// scrollContainerRef 是透過 context 從祖先元件(TabShell)拿到的 ref,不是本元件自己
	// 掛上去的 ref——react-virtual 內部靠 ResizeObserver 偵測 scroll element 就緒後觸發重繪,
	// 但跨元件拿到的 ref 這個機制不夠可靠,所以改成用 state 明確記一次,保證真的會重繪。
	const [scrollElement, setScrollElement] = useState<HTMLDivElement | null>(null)
	useEffect(() => {
		setScrollElement(scrollContainerRef?.current ?? null)
	}, [scrollContainerRef])

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

	const virtualizer = useVirtualizer({
		count: filtered.length,
		getScrollElement: () => scrollElement,
		estimateSize: () => ESTIMATED_ROW_HEIGHT,
		overscan: OVERSCAN,
		getItemKey: (index) => filtered[index].slug,
	})

	return (
		<div className='flex flex-col gap-4'>
			<div className='flex flex-wrap items-center gap-2'>
				<div className='min-w-40 flex-1'>
					<SearchInput value={keyword} onChange={setKeyword} placeholder={labels.searchPlaceholder} />
				</div>
				{dateBounds ? (
					<DateRangePicker
						lng={lng}
						label={labels.dateRange}
						value={dateRange}
						bounds={dateBounds}
						onChange={setDateRange}
					/>
				) : null}
			</div>

			{filtered.length === 0 ? (
				<div className='flex flex-col items-center gap-2 py-8 text-center'>
					<SearchX className='text-muted-foreground/50 size-8' />
					<p className='text-muted-foreground text-sm'>{labels.empty}</p>
				</div>
			) : (
				// react-virtual 只渲染可視範圍內的列,捲出畫面的列直接從 DOM 移除(不只是跳過繪製)。
				// 每列的垂直位置是量測後才知道的浮點數,無法事先寫成 Tailwind class,這裡是唯一用 inline style 的地方。
				<div className='relative ml-2' style={{ height: virtualizer.getTotalSize() }}>
					<div className='border-border absolute top-0 bottom-0 left-0 border-l' />
					{virtualizer.getVirtualItems().map((row) => {
						const event = filtered[row.index]
						return (
							<div
								key={row.key}
								ref={virtualizer.measureElement}
								data-index={row.index}
								style={{ transform: `translateY(${row.start}px)` }}
								className='absolute top-0 left-0 w-full pb-5 pl-4'
							>
								<EventTimelineCard lng={lng} event={event} labels={labels} />
							</div>
						)
					})}
				</div>
			)}
		</div>
	)
}

// memo:虛擬清單在每次捲動都會 re-render 外層,列本身的 props 不變就不用重繪內容。
const EventTimelineCard = memo(
	({ lng, event, labels }: { lng: string; event: TopicPageEventData; labels: EventTimelineLabels }) => {
		return (
			<div className='relative'>
				<span
					className={cn(
						'absolute -left-[21px] mt-2 size-2.5 rounded-full',
						event.isResearching ? 'bg-info animate-pulse' : 'bg-warning',
					)}
				/>
				{event.isResearching ? (
					<div className='bg-info/10 block rounded-lg p-3'>
						<div className='flex items-center justify-between gap-2'>
							<span className='font-medium'>{event.title}</span>
							<Badge variant='info'>
								<Clock className='size-3' />
								{labels.researching}
							</Badge>
						</div>
						<div className='mt-1 flex flex-wrap items-center justify-between gap-2'>
							<span className='text-muted-foreground text-xs'>{labels.researchingHint}</span>
							{event.seenLabel ? (
								<span className='text-muted-foreground font-mono text-xs'>{event.seenLabel}</span>
							) : null}
						</div>
					</div>
				) : (
					<Link
						href={`/${lng}/event/${event.slug}`}
						className='group bg-secondary/40 hover:bg-secondary/60 block rounded-lg p-3 transition-all duration-200 hover:scale-[1.01]'
					>
						<div className='flex items-center justify-between gap-2'>
							<span className='font-medium'>{event.title}</span>
							<ReliabilityBadge reliability={event.reliability} label={event.reliabilityLabel} />
						</div>
						<div className='mt-1 flex flex-wrap items-center justify-between gap-2'>
							<span className='text-info inline-flex items-center gap-1 text-xs'>
								{labels.viewEvent}{' '}
								<ArrowRight className='size-3 transition-transform duration-200 group-hover:translate-x-0.5' />
								<LinkPendingSpinner />
							</span>
							{event.seenLabel ? (
								<span className='text-muted-foreground font-mono text-xs'>{event.seenLabel}</span>
							) : null}
						</div>
					</Link>
				)}
			</div>
		)
	},
)
