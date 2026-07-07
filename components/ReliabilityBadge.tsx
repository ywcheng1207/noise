import { Badge } from '@/components/Badge'
import { RELIABILITY_ICON, RELIABILITY_VARIANT } from '@/lib/ui'

export function ReliabilityBadge({
	reliability,
	label,
	className,
}: {
	reliability: string
	label: string
	className?: string
}) {
	const Icon = RELIABILITY_ICON[reliability] ?? RELIABILITY_ICON.UNVERIFIED

	return (
		<Badge variant={RELIABILITY_VARIANT[reliability] ?? 'muted'} className={className}>
			<Icon className='size-3' />
			{label}
		</Badge>
	)
}
