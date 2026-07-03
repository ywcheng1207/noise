import { cn } from '@/lib/utils'

/** 品牌標誌:逆著風線飄揚的旗。旗面用 primary,旗桿隨文字色,風線用 muted。 */
export const BrandLogo = ({ className }: { className?: string }) => {
	return (
		<svg viewBox='0 0 24 24' fill='none' role='img' aria-label='逆風' className={cn('size-6', className)}>
			<path d='M5 3.5v17' stroke='currentColor' strokeWidth='1.8' strokeLinecap='round' />
			<path
				d='M5 4.4c2.7-1.7 4.7 1.3 7.4.3 2.3-.9 3.6-.5 5 .3l-1.7 6.3c-1.4-.8-2.7-1.2-5-.3-2.7 1-4.7-2-7.4-.3Z'
				className='fill-primary'
			/>
			<path
				d='M21 16h-7M18.5 19h-9'
				strokeWidth='1.6'
				strokeLinecap='round'
				className='stroke-muted-foreground/70'
			/>
		</svg>
	)
}
