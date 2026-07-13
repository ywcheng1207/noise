'use client'

import type { ComponentProps } from 'react'
import { Check } from 'lucide-react'
import * as CheckboxPrimitive from '@radix-ui/react-checkbox'

import { cn } from '@/lib/utils'

export const Checkbox = ({ className, ...props }: ComponentProps<typeof CheckboxPrimitive.Root>) => {
	return (
		<CheckboxPrimitive.Root
			className={cn(
				'peer border-input shadow-xs data-[state=checked]:bg-primary data-[state=checked]:border-primary data-[state=checked]:text-primary-foreground size-4 shrink-0 rounded-[4px] border outline-none transition-colors disabled:cursor-not-allowed disabled:opacity-50',
				className,
			)}
			{...props}
		>
			<CheckboxPrimitive.Indicator className='grid place-content-center text-current'>
				<Check className='size-3.5' />
			</CheckboxPrimitive.Indicator>
		</CheckboxPrimitive.Root>
	)
}
