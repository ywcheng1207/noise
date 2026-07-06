'use client'

import type { ComponentProps } from 'react'
import * as PopoverPrimitive from '@radix-ui/react-popover'

import { cn } from '@/lib/utils'

export const Popover = PopoverPrimitive.Root

export const PopoverTrigger = PopoverPrimitive.Trigger

export const PopoverContent = ({
	className,
	align = 'center',
	sideOffset = 8,
	...props
}: ComponentProps<typeof PopoverPrimitive.Content>) => {
	return (
		<PopoverPrimitive.Portal>
			<PopoverPrimitive.Content
				align={align}
				sideOffset={sideOffset}
				className={cn(
					'bg-card/95 text-card-foreground animate-popover-in z-50 rounded-lg p-3 shadow-lg backdrop-blur-md outline-none',
					className,
				)}
				{...props}
			/>
		</PopoverPrimitive.Portal>
	)
}
