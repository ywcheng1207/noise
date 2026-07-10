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
				className='hover:bg-secondary/60 -mx-2 flex w-full cursor-pointer items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-left transition-colors duration-200'
			>
				<h2 className='text-sm font-medium'>{title}</h2>
				<ChevronDown
					className={cn(
						'text-muted-foreground size-4 shrink-0 transition-transform duration-300',
						isOpen && 'rotate-180',
					)}
				/>
			</button>
			<div
				className={cn(
					'grid transition-all duration-300 ease-in-out',
					isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]',
				)}
			>
				<div className='overflow-hidden'>
					<div
						className={cn(
							'flex flex-col gap-3 transition-opacity duration-300',
							isOpen ? 'opacity-100 delay-100' : 'opacity-0',
						)}
					>
						{children}
					</div>
				</div>
			</div>
		</section>
	)
}
