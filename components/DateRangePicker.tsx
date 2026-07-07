'use client'

import { useEffect, useState } from 'react'
import { CalendarRange } from 'lucide-react'
import type { DateRange } from 'react-day-picker'
import { zhTW } from 'react-day-picker/locale/zh-TW'
import { enUS } from 'react-day-picker/locale/en-US'

import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { formatOccurred, parseOccurredDate } from '@/lib/dates'

export interface DateRangeValue {
	from: string
	to: string
}

// react-day-picker 內部一律用「本地時區」的年月日存取器操作 Date(月份導覽、disabled 判斷皆然),
// 這裡的建構/序列化必須跟它對稱使用本地時區,否則在非 UTC 時區下往返一次就會偏移一天。
function toBoundDate(dateKey: string) {
	return new Date(`${dateKey}T00:00:00`)
}

function toDateKey(date: Date) {
	const year = date.getFullYear()
	const month = String(date.getMonth() + 1).padStart(2, '0')
	const day = String(date.getDate()).padStart(2, '0')
	return `${year}-${month}-${day}`
}

// 顯示文字則走全站統一的 UTC 錨定格式化(lib/dates.ts),避免兩套日期慣例分岔。
function formatDateKey(lng: string, dateKey: string | null) {
	if (!dateKey) return null
	return formatOccurred({ lng, occurredAt: parseOccurredDate(dateKey).occurredAt, precision: 'DAY' })
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
	const [pending, setPending] = useState<DateRange>({
		from: toBoundDate(value.from),
		to: toBoundDate(value.to),
	})
	const isZh = lng.startsWith('zh')

	const minDate = toBoundDate(bounds.from)
	const maxDate = toBoundDate(bounds.to)

	// 每次打開時,以目前已套用的範圍為起點重新開始挑選(避免延續上次選到一半的殘留狀態)。
	useEffect(() => {
		if (open) setPending({ from: toBoundDate(value.from), to: toBoundDate(value.to) })
	}, [open, value.from, value.to])

	function handleSelect(range: DateRange | undefined) {
		if (!range?.from) return
		setPending(range)
		// 起訖都選定就立即套用,但不關閉 popover,方便使用者連續調整區間。
		if (range.to) {
			onChange({ from: toDateKey(range.from), to: toDateKey(range.to) })
		}
	}

	const fromLabel = formatDateKey(lng, pending.from ? toDateKey(pending.from) : null)
	const toLabel = formatDateKey(lng, pending.to ? toDateKey(pending.to) : null)

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger asChild>
				<button
					type='button'
					className='bg-input text-foreground hover:bg-secondary flex shrink-0 cursor-pointer items-center gap-1.5 rounded-lg px-3 py-2 text-sm transition-all duration-150 hover:scale-[1.02]'
				>
					<CalendarRange className='text-muted-foreground size-4' />
					<span className='text-muted-foreground hidden sm:inline'>{label}</span>
					<span className='font-medium whitespace-nowrap'>
						{fromLabel} – {toLabel}
					</span>
				</button>
			</PopoverTrigger>
			<PopoverContent>
				<Calendar
					mode='range'
					locale={isZh ? zhTW : enUS}
					defaultMonth={pending.from}
					selected={pending}
					onSelect={handleSelect}
					startMonth={minDate}
					endMonth={maxDate}
					disabled={{ before: minDate, after: maxDate }}
				/>
			</PopoverContent>
		</Popover>
	)
}
