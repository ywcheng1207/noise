import { getT } from '@/i18n'
import { Badge } from '@/components/Badge'
import { RELIABILITY_VARIANT, TIER_VARIANT } from '@/lib/ui'
import { RELIABILITIES, TIERS } from '@/lib/enums'

export async function IntroContent({ lng }: { lng: string }) {
	const { t } = await getT(lng)

	return (
		<div className='flex flex-col gap-6'>
			<p className='text-muted-foreground text-sm leading-relaxed sm:text-base'>{t('overview.subtitle')}</p>

			<section className='flex flex-col gap-2'>
				<h2 className='text-base font-medium'>{t('intro.pipelineHeading')}</h2>
				<p className='text-muted-foreground text-sm leading-relaxed'>{t('intro.pipelineBody')}</p>
			</section>

			<section className='flex flex-col gap-4'>
				<div className='flex flex-col gap-2'>
					<h2 className='text-base font-medium'>{t('intro.credibilityHeading')}</h2>
					<p className='text-muted-foreground text-sm leading-relaxed'>{t('intro.credibilityIntro')}</p>
				</div>

				<div className='flex flex-col gap-2'>
					<h3 className='text-muted-foreground text-sm font-medium'>{t('intro.topicTiersHeading')}</h3>
					<ul className='flex flex-col gap-1.5'>
						{RELIABILITIES.map((key) => (
							<li key={key} className='flex items-start gap-2 text-sm'>
								<Badge variant={RELIABILITY_VARIANT[key] ?? 'muted'} className='mt-0.5 shrink-0'>
									{t(`reliability.${key}`)}
								</Badge>
								<span className='text-muted-foreground'>{t(`intro.topicTier.${key}`)}</span>
							</li>
						))}
					</ul>
				</div>

				<div className='flex flex-col gap-2'>
					<h3 className='text-muted-foreground text-sm font-medium'>{t('intro.sourceTiersHeading')}</h3>
					<ul className='flex flex-col gap-1.5'>
						{TIERS.map((key) => (
							<li key={key} className='flex items-start gap-2 text-sm'>
								<Badge variant={TIER_VARIANT[key] ?? 'muted'} className='mt-0.5 shrink-0'>
									{t(`tier.${key}`)}
								</Badge>
								<span className='text-muted-foreground'>{t(`intro.sourceTier.${key}`)}</span>
							</li>
						))}
					</ul>
				</div>
			</section>
		</div>
	)
}
