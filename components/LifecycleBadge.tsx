import { Badge } from '@/components/Badge'
import { LIFECYCLE_ICON, LIFECYCLE_VARIANT } from '@/lib/ui'

export function LifecycleBadge({
	lifecycle,
	label,
	className,
}: {
	lifecycle: string
	label?: string
	className?: string
}) {
	if (lifecycle === 'ACTIVE' || !label) return null

	const Icon = LIFECYCLE_ICON[lifecycle]
	if (!Icon) return null

	return (
		<Badge variant={LIFECYCLE_VARIANT[lifecycle] ?? 'muted'} className={className}>
			<Icon className='size-3' />
			{label}
		</Badge>
	)
}
