'use client'

import type { ComponentProps } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { DayPicker } from 'react-day-picker'

import { cn } from '@/lib/utils'

export function Calendar({ className, classNames, ...props }: ComponentProps<typeof DayPicker>) {
	return (
		<DayPicker
			className={cn('p-1', className)}
			classNames={{
				months: 'flex flex-col gap-3',
				month: 'flex flex-col gap-3',
				month_caption: 'flex items-center justify-center px-8 text-sm font-medium',
				nav: 'flex items-center justify-between',
				button_previous:
					'absolute left-1 flex size-7 cursor-pointer items-center justify-center rounded-lg text-muted-foreground transition-all duration-150 hover:bg-secondary hover:scale-105 disabled:pointer-events-none disabled:opacity-30',
				button_next:
					'absolute right-1 flex size-7 cursor-pointer items-center justify-center rounded-lg text-muted-foreground transition-all duration-150 hover:bg-secondary hover:scale-105 disabled:pointer-events-none disabled:opacity-30',
				month_grid: 'mt-2 w-full border-collapse',
				weekdays: 'flex',
				weekday: 'text-muted-foreground w-9 text-center text-xs font-medium',
				week: 'mt-1 flex w-full',
				day: 'relative flex size-9 items-center justify-center p-0 text-center text-sm',
				day_button:
					'flex size-9 cursor-pointer items-center justify-center rounded-full transition-all duration-150 hover:scale-105 hover:bg-secondary',
				range_start: '[&>button]:bg-primary [&>button]:text-primary-foreground [&>button]:hover:bg-primary',
				range_end: '[&>button]:bg-primary [&>button]:text-primary-foreground [&>button]:hover:bg-primary',
				range_middle: '[&>button]:bg-primary/20 [&>button]:hover:bg-primary/30',
				selected: '[&>button]:bg-primary [&>button]:text-primary-foreground',
				today: '[&>button]:text-primary [&>button]:font-semibold',
				outside: 'text-muted-foreground/40',
				disabled: 'text-muted-foreground/30 pointer-events-none',
				hidden: 'invisible',
				...classNames,
			}}
			components={{
				Chevron: ({ orientation }) =>
					orientation === 'left' ? <ChevronLeft className='size-4' /> : <ChevronRight className='size-4' />,
			}}
			{...props}
		/>
	)
}
