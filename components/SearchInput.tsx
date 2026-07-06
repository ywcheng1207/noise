'use client'

import { Search } from 'lucide-react'

export function SearchInput({
	value,
	onChange,
	placeholder,
}: {
	value: string
	onChange: (value: string) => void
	placeholder: string
}) {
	return (
		<div className='relative'>
			<Search className='text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2' />
			<input
				type='search'
				value={value}
				onChange={(e) => onChange(e.target.value)}
				placeholder={placeholder}
				className='border-border bg-card/50 placeholder:text-muted-foreground focus:border-primary/40 w-full rounded-lg border py-2 pr-3 pl-9 text-sm backdrop-blur-sm transition-colors outline-none'
			/>
		</div>
	)
}
