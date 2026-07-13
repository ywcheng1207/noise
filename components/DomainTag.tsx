import { DOMAIN_ICON } from '@/lib/ui'

export const DomainTag = ({ domain, label }: { domain: string; label: string }) => {
	const Icon = DOMAIN_ICON[domain] ?? DOMAIN_ICON.OTHER
	return (
		<span className='bg-secondary/60 text-muted-foreground inline-flex items-center gap-1 rounded-lg px-2 py-0.5 text-xs'>
			<Icon className='size-3' />
			{label}
		</span>
	)
}
