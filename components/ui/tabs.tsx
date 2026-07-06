'use client'

import type { ComponentProps } from 'react'
import * as TabsPrimitive from '@radix-ui/react-tabs'

import { cn } from '@/lib/utils'

export const Tabs = TabsPrimitive.Root

export const TabsList = ({ className, ...props }: ComponentProps<typeof TabsPrimitive.List>) => {
	return (
		<TabsPrimitive.List
			className={cn('bg-secondary/60 inline-flex w-fit items-center gap-1 rounded-lg p-1', className)}
			{...props}
		/>
	)
}

export const TabsTrigger = ({ className, ...props }: ComponentProps<typeof TabsPrimitive.Trigger>) => {
	return (
		<TabsPrimitive.Trigger
			className={cn(
				'text-muted-foreground hover:text-foreground cursor-pointer rounded-lg px-3.5 py-1.5 text-sm font-medium transition-all duration-200 hover:scale-[1.03]',
				'data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-sm',
				className,
			)}
			{...props}
		/>
	)
}

export const TabsContent = TabsPrimitive.Content
