'use client'

import type { ComponentProps } from 'react'
import { Check } from 'lucide-react'
import * as DropdownMenuPrimitive from '@radix-ui/react-dropdown-menu'

import { cn } from '@/lib/utils'

export const DropdownMenu = DropdownMenuPrimitive.Root

export const DropdownMenuTrigger = DropdownMenuPrimitive.Trigger

export const DropdownMenuContent = ({
	className,
	align = 'end',
	sideOffset = 8,
	...props
}: ComponentProps<typeof DropdownMenuPrimitive.Content>) => {
	return (
		<DropdownMenuPrimitive.Portal>
			<DropdownMenuPrimitive.Content
				align={align}
				sideOffset={sideOffset}
				className={cn(
					'bg-card/95 text-card-foreground animate-popover-in z-50 min-w-32 rounded-lg p-1 shadow-lg backdrop-blur-md outline-none',
					className,
				)}
				{...props}
			/>
		</DropdownMenuPrimitive.Portal>
	)
}

export const DropdownMenuItem = ({
	className,
	isActive = false,
	children,
	...props
}: ComponentProps<typeof DropdownMenuPrimitive.Item> & { isActive?: boolean }) => {
	return (
		<DropdownMenuPrimitive.Item
			className={cn(
				'hover:bg-secondary/70 flex cursor-pointer items-center justify-between gap-2 rounded-md px-2.5 py-1.5 text-sm transition-colors outline-none select-none',
				isActive ? 'text-foreground font-medium' : 'text-muted-foreground',
				className,
			)}
			{...props}
		>
			{children}
			{isActive ? <Check className='size-3.5' /> : null}
		</DropdownMenuPrimitive.Item>
	)
}
