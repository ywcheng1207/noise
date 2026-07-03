import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import type { BadgeVariant } from '@/lib/ui'

const VARIANT_CLASS: Record<BadgeVariant, string> = {
	success: 'bg-success/10 text-success',
	info: 'bg-info/10 text-info',
	warning: 'bg-warning/10 text-warning',
	muted: 'bg-muted text-muted-foreground',
}

export function Badge({
	variant = 'muted',
	className,
	children,
}: {
	variant?: BadgeVariant
	className?: string
	children: ReactNode
}) {
	return (
		<span
			className={cn(
				'inline-flex items-center gap-1 rounded-lg px-2 py-0.5 text-xs font-medium backdrop-blur-sm',
				VARIANT_CLASS[variant],
				className,
			)}
		>
			{children}
		</span>
	)
}
