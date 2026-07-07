'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { CalendarDays, SearchX } from 'lucide-react'
import { LinkPendingSpinner } from '@/components/LinkPendingSpinner'
import { DateRangePicker, type DateRangeValue } from '@/components/DateRangePicker'

export interface LogRow {
	key: string
	dateLabel: string
	summaryLine: string
}

interface LogListLabels {
	empty: string
	dateRange: string
}

export function LogList({
	lng,
	rows,
	dateBounds,
	labels,
}: {
	lng: string
	rows: LogRow[]
	dateBounds: DateRangeValue | null
	labels: LogListLabels
}) {
	const [dateRange, setDateRange] = useState<DateRangeValue>(dateBounds ?? { from: '', to: '' })

	const filtered = useMemo(
		() =>
			rows.filter((row) => {
				if (dateRange.from && row.key < dateRange.from) return false
				if (dateRange.to && row.key > dateRange.to) return false
				return true
			}),
		[rows, dateRange],
	)

	return (
		<div className='flex flex-col gap-5'>
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
				<div className='flex flex-col items-center gap-2 py-8 text-center'>
					<SearchX className='text-muted-foreground/50 size-8' />
					<p className='text-muted-foreground text-sm'>{labels.empty}</p>
				</div>
			) : (
				<ol className='flex flex-col gap-2'>
					{filtered.map((row) => (
						<li key={row.key}>
							<Link
								href={`/${lng}/log/${row.key}`}
								className='bg-secondary/40 hover:bg-secondary/60 block rounded-lg p-4 transition-all duration-200 hover:scale-[1.01]'
							>
								<div className='flex items-center gap-2'>
									<CalendarDays className='text-info size-4' />
									<span className='font-medium'>{row.dateLabel}</span>
									<LinkPendingSpinner />
								</div>
								<p className='text-muted-foreground mt-1 text-xs'>{row.summaryLine}</p>
							</Link>
						</li>
					))}
				</ol>
			)}
		</div>
	)
}
