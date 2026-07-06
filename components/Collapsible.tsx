'use client'

import { useState, type ReactNode } from 'react'
import { ChevronDown } from 'lucide-react'

import { cn } from '@/lib/utils'

export function Collapsible({
	title,
	defaultOpen = true,
	children,
}: {
	title: ReactNode
	defaultOpen?: boolean
	children: ReactNode
}) {
	const [isOpen, setIsOpen] = useState(defaultOpen)

	function handleToggle() {
		setIsOpen((prev) => !prev)
	}

	return (
		<section className='flex flex-col gap-3'>
			<button
				type='button'
				onClick={handleToggle}
				className='flex w-full cursor-pointer items-center justify-between gap-2 text-left'
			>
				<h2 className='text-sm font-medium'>{title}</h2>
				<ChevronDown
					className={cn(
						'text-muted-foreground size-4 shrink-0 transition-transform duration-200',
						isOpen && 'rotate-180',
					)}
				/>
			</button>
			{isOpen ? children : null}
		</section>
	)
}
