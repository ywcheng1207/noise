'use client'

import { Search } from 'lucide-react'
import { cn } from '@/lib/utils'

export function SearchInput({
	value,
	onChange,
	placeholder,
	className,
}: {
	value: string
	onChange: (value: string) => void
	placeholder: string
	className?: string
}) {
	return (
		<div className={cn('relative', className)}>
			<Search className='text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2' />
			<input
				type='search'
				value={value}
				onChange={(e) => onChange(e.target.value)}
				placeholder={placeholder}
				className='bg-input placeholder:text-muted-foreground focus-visible:ring-primary/40 w-full rounded-lg py-2 pr-3 pl-9 text-sm transition-colors outline-none focus-visible:ring-2'
			/>
		</div>
	)
}
