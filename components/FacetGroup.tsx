import { cn } from '@/lib/utils'

export interface FacetOption {
	value: string
	label: string
}

export const FacetGroup = ({
	label,
	options,
	value,
	onChange,
}: {
	label: string
	options: FacetOption[]
	value: string
	onChange: (value: string) => void
}) => {
	return (
		<div className='flex items-center gap-2 lg:flex-col lg:items-start'>
			<span className='text-muted-foreground w-14 shrink-0 text-xs lg:w-auto'>{label}</span>
			<div className='flex min-w-0 gap-1.5 overflow-x-auto lg:flex-wrap lg:overflow-visible'>
				{options.map((opt) => (
					<button
						key={opt.value}
						type='button'
						onClick={() => onChange(opt.value)}
						className={cn(
							'shrink-0 cursor-pointer rounded-lg px-3 py-1 text-xs whitespace-nowrap transition-all duration-200 hover:scale-[1.03]',
							value === opt.value
								? 'bg-secondary text-foreground'
								: 'bg-secondary/30 text-muted-foreground hover:bg-secondary/60 hover:text-foreground',
						)}
					>
						{opt.label}
					</button>
				))}
			</div>
		</div>
	)
}
