'use client'

import { useState } from 'react'
import { CalendarRange } from 'lucide-react'
import type { DateRange } from 'react-day-picker'
import { zhTW } from 'react-day-picker/locale/zh-TW'
import { enUS } from 'react-day-picker/locale/en-US'

import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { formatOccurred } from '@/lib/dates'

export interface DateRangeValue {
	from: string
	to: string
}

function toDateKey(date: Date) {
	return date.toISOString().slice(0, 10)
}

function toBoundDate(dateKey: string) {
	return new Date(`${dateKey}T00:00:00`)
}

export function DateRangePicker({
	lng,
	label,
	value,
	bounds,
	onChange,
}: {
	lng: string
	label: string
	value: DateRangeValue
	bounds: DateRangeValue
	onChange: (range: DateRangeValue) => void
}) {
	const [open, setOpen] = useState(false)
	const isZh = lng.startsWith('zh')

	const selected: DateRange = { from: toBoundDate(value.from), to: toBoundDate(value.to) }
	const minDate = toBoundDate(bounds.from)
	const maxDate = toBoundDate(bounds.to)

	function handleSelect(range: DateRange | undefined) {
		if (!range?.from) return
		const from = range.from
		const to = range.to ?? range.from
		onChange({ from: toDateKey(from), to: toDateKey(to) })
		if (range.to) setOpen(false)
	}

	const fromLabel = formatOccurred({ lng, occurredAt: selected.from ?? null, precision: 'DAY' })
	const toLabel = formatOccurred({ lng, occurredAt: selected.to ?? null, precision: 'DAY' })

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger asChild>
				<button
					type='button'
					className='bg-input text-foreground hover:bg-secondary flex cursor-pointer items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs transition-all duration-150 hover:scale-[1.02]'
				>
					<CalendarRange className='text-muted-foreground size-3.5' />
					<span className='text-muted-foreground'>{label}</span>
					<span className='font-medium'>
						{fromLabel} – {toLabel}
					</span>
				</button>
			</PopoverTrigger>
			<PopoverContent>
				<Calendar
					mode='range'
					locale={isZh ? zhTW : enUS}
					defaultMonth={selected.from}
					selected={selected}
					onSelect={handleSelect}
					startMonth={minDate}
					endMonth={maxDate}
					disabled={{ before: minDate, after: maxDate }}
				/>
			</PopoverContent>
		</Popover>
	)
}
