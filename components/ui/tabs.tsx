'use client'

import type { ComponentProps } from 'react'
import * as TabsPrimitive from '@radix-ui/react-tabs'

import { cn } from '@/lib/utils'

export const Tabs = TabsPrimitive.Root

export const TabsList = ({ className, ...props }: ComponentProps<typeof TabsPrimitive.List>) => {
	return <TabsPrimitive.List className={cn('flex w-fit items-end gap-1', className)} {...props} />
}

export const TabsTrigger = ({ className, ...props }: ComponentProps<typeof TabsPrimitive.Trigger>) => {
	return (
		<TabsPrimitive.Trigger
			className={cn(
				'bg-secondary text-secondary-foreground cursor-pointer rounded-t-lg px-6 py-3 text-sm font-medium transition-all duration-200 hover:scale-[1.02]',
				'data-[state=active]:bg-card data-[state=active]:text-card-foreground',
				className,
			)}
			{...props}
		/>
	)
}

export const TabsContent = ({ className, ...props }: ComponentProps<typeof TabsPrimitive.Content>) => {
	return (
		<TabsPrimitive.Content
			className={cn('bg-card animate-tab-in rounded-b-lg p-4 sm:p-6', className)}
			{...props}
		/>
	)
}
