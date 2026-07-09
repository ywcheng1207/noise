import { Telescope } from 'lucide-react'
import { prisma } from '@/lib/prisma'
import { getT } from '@/i18n'
import { REGION_LABELS } from '@/lib/regions'
import { DOMAIN_ICON } from '@/lib/ui'

export const dynamic = 'force-dynamic'

export default async function CandidatesPage({ params }: { params: Promise<{ lng: string }> }) {
	const { lng } = await params
	const { t } = await getT(lng)
	const isZh = lng.startsWith('zh')

	const candidates = await prisma.threadCandidate.findMany({
		where: { status: 'WATCHING' },
		orderBy: { lastSpottedAt: 'desc' },
	})

	return (
		<div className='mx-auto flex w-full max-w-3xl flex-col gap-5'>
			<div>
				<h1 className='flex items-center gap-2 text-2xl font-medium'>
					<Telescope className='text-primary size-5' />
					{t('overview.candidatePool')}
				</h1>
				<p className='text-muted-foreground mt-2 text-sm leading-relaxed'>{t('candidates.intro')}</p>
			</div>

			{candidates.length === 0 ? (
				<p className='text-muted-foreground py-8 text-center text-sm'>{t('candidates.empty')}</p>
			) : (
				<ul className='flex flex-col gap-3'>
					{candidates.map((c) => {
						const DomainIcon = DOMAIN_ICON[c.domain] ?? DOMAIN_ICON.OTHER
						const title = isZh ? c.titleZh : c.titleEn
						const signal = isZh ? c.signalZh : c.signalEn
						return (
							<li key={c.id} className='bg-secondary/40 flex flex-col gap-2 rounded-lg p-4'>
								<div className='flex items-start justify-between gap-2'>
									<span className='font-medium'>{title}</span>
									<span className='bg-secondary/60 text-muted-foreground inline-flex shrink-0 items-center gap-1 rounded-lg px-2 py-0.5 text-xs'>
										<DomainIcon className='size-3' />
										{t(`domain.${c.domain}`)}
									</span>
								</div>
								{signal ? <p className='text-muted-foreground text-sm leading-6'>{signal}</p> : null}
								<div className='flex flex-wrap items-center gap-1.5'>
									{c.regions.map((r) => (
										<span
											key={r}
											className='bg-secondary/60 text-muted-foreground rounded-lg px-2 py-0.5 text-xs'
										>
											{isZh ? REGION_LABELS[r].zh : REGION_LABELS[r].en}
										</span>
									))}
									<span className='text-muted-foreground text-xs'>
										{t('candidates.mentionCount', { count: c.mentionCount })}
									</span>
								</div>
							</li>
						)
					})}
				</ul>
			)}
		</div>
	)
}
