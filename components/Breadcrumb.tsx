import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface BreadcrumbItem {
	label: string
	href?: string
}

export const Breadcrumb = ({ items, className }: { items: BreadcrumbItem[]; className?: string }) => {
	return (
		<nav
			aria-label='breadcrumb'
			className={cn('text-muted-foreground flex flex-wrap items-center gap-1 text-sm', className)}
		>
			{items.map((item, index) => {
				const isLast = index === items.length - 1
				const isLink = Boolean(item.href) && !isLast
				return (
					<span key={item.href ?? item.label} className='inline-flex min-w-0 items-center gap-1'>
						{index > 0 ? <ChevronRight className='size-3.5 shrink-0 opacity-60' /> : null}
						{isLink ? (
							<Link href={item.href ?? '#'} className='hover:text-foreground max-w-[12rem] truncate'>
								{item.label}
							</Link>
						) : (
							<span className={cn('max-w-[16rem] truncate', isLast && 'text-foreground')}>{item.label}</span>
						)}
					</span>
				)
			})}
		</nav>
	)
}
