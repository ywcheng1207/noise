import type { ReactNode } from 'react'
import Image from 'next/image'
import { Link2, Scale, ShieldCheck, Tags, Workflow } from 'lucide-react'
import { getT } from '@/i18n'
import { Badge } from '@/components/Badge'
import { ReliabilityBadge } from '@/components/ReliabilityBadge'
import { Carousel, type CarouselSlide } from '@/components/ui/carousel'
import { TIER_ICON, TIER_VARIANT } from '@/lib/ui'
import { RELIABILITIES, TIERS } from '@/lib/enums'

export async function IntroContent({ lng }: { lng: string }) {
	const { t } = await getT(lng)
	const isZh = lng.startsWith('zh')
	const localeSuffix = isZh ? 'zh-hant' : 'en'

	const slides: CarouselSlide[] = [
		{
			key: 'pipeline',
			content: (
				<IntroSlide icon={<Workflow className='text-primary size-4' />} heading={t('intro.pipelineHeading')}>
					<Image
						src={`/intro/topics-overview-${localeSuffix}.png`}
						alt={t('intro.pipelineImageAlt')}
						width={832}
						height={381}
						className='border-border h-auto w-full rounded-lg border'
					/>
					<p className='text-muted-foreground text-sm leading-relaxed'>{t('intro.pipelineBody')}</p>
				</IntroSlide>
			),
		},
		{
			key: 'link-check',
			content: (
				<IntroSlide icon={<Link2 className='text-primary size-4' />} heading={t('intro.linkCheckHeading')}>
					<p className='text-muted-foreground text-sm leading-relaxed'>{t('intro.linkCheckBody')}</p>
				</IntroSlide>
			),
		},
		{
			key: 'credibility',
			content: (
				<IntroSlide
					icon={<ShieldCheck className='text-primary size-4' />}
					heading={t('intro.credibilityHeading')}
				>
					<Image
						src={`/intro/event-sources-${localeSuffix}.png`}
						alt={t('intro.credibilityImageAlt')}
						width={400}
						height={isZh ? 296 : 336}
						className='border-border h-auto w-full rounded-lg border'
					/>
					<p className='text-muted-foreground text-sm leading-relaxed'>{t('intro.credibilityIntro')}</p>
				</IntroSlide>
			),
		},
		{
			key: 'topic-tiers',
			content: (
				<IntroSlide icon={<Tags className='text-primary size-4' />} heading={t('intro.topicTiersHeading')}>
					<ul className='flex flex-col gap-1.5'>
						{RELIABILITIES.map((key) => (
							<li key={key} className='flex items-start gap-2 text-sm'>
								<ReliabilityBadge
									reliability={key}
									label={t(`reliability.${key}`)}
									className='mt-0.5 shrink-0'
								/>
								<span className='text-muted-foreground'>{t(`intro.topicTier.${key}`)}</span>
							</li>
						))}
					</ul>
				</IntroSlide>
			),
		},
		{
			key: 'source-tiers',
			content: (
				<IntroSlide icon={<Scale className='text-primary size-4' />} heading={t('intro.sourceTiersHeading')}>
					<ul className='flex flex-col gap-1.5'>
						{TIERS.map((key) => {
							const TierIcon = TIER_ICON[key] ?? TIER_ICON.UNVERIFIED
							return (
								<li key={key} className='flex items-start gap-2 text-sm'>
									<Badge variant={TIER_VARIANT[key] ?? 'muted'} className='mt-0.5 shrink-0'>
										<TierIcon className='size-3' />
										{t(`tier.${key}`)}
									</Badge>
									<span className='text-muted-foreground'>{t(`intro.sourceTier.${key}`)}</span>
								</li>
							)
						})}
					</ul>
				</IntroSlide>
			),
		},
	]

	return (
		<div className='flex flex-col gap-6'>
			<p className='text-muted-foreground text-sm leading-relaxed sm:text-base'>{t('overview.subtitle')}</p>
			<Carousel slides={slides} />
		</div>
	)
}

function IntroSlide({ icon, heading, children }: { icon: ReactNode; heading: string; children: ReactNode }) {
	return (
		<section className='bg-secondary/30 flex h-full min-h-44 flex-col gap-3 rounded-lg p-4 sm:p-5'>
			<h2 className='flex items-center gap-2 text-base font-medium'>
				{icon}
				{heading}
			</h2>
			{children}
		</section>
	)
}
