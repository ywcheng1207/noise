import type { ReactNode } from 'react'
import Image from 'next/image'
import { CheckCircle2, Link2, Scale, ScrollText, Search, ShieldCheck, Tags, Telescope, Workflow } from 'lucide-react'
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
	const sourceCardHeight = isZh ? 132 : 152
	const topicBadgeHeight = isZh ? 52 : 76
	const charterCardHeight = isZh ? 364 : 470

	const slides: CarouselSlide[] = [
		{
			key: 'pipeline',
			content: (
				<IntroSlide icon={<Workflow className='text-primary size-4' />} heading={t('intro.pipelineHeading')}>
					<IntroExample
						src={`/intro/topic-card-${localeSuffix}.png`}
						alt={t('intro.pipelineImageAlt')}
						width={828}
						height={189}
						caption={t('intro.pipelineCaption')}
					/>
					<p className='text-muted-foreground text-sm leading-relaxed'>{t('intro.pipelineBody')}</p>
				</IntroSlide>
			),
		},
		{
			key: 'charter',
			content: (
				<IntroSlide icon={<ScrollText className='text-primary size-4' />} heading={t('intro.charterHeading')}>
					<IntroExample
						src={`/intro/charter-card-${localeSuffix}.png`}
						alt={t('intro.charterImageAlt')}
						width={604}
						height={charterCardHeight}
						caption={t('intro.charterCaption')}
					/>
					<p className='text-muted-foreground text-sm leading-relaxed'>{t('intro.charterBody')}</p>
				</IntroSlide>
			),
		},
		{
			key: 'link-check',
			content: (
				<IntroSlide icon={<Link2 className='text-primary size-4' />} heading={t('intro.linkCheckHeading')}>
					<LinkCheckDiagram caption={t('intro.linkCheckCaption')} />
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
					<IntroExample
						src={`/intro/source-card-${localeSuffix}.png`}
						alt={t('intro.credibilityImageAlt')}
						width={396}
						height={sourceCardHeight}
						caption={t('intro.credibilityCaption')}
					/>
					<p className='text-muted-foreground text-sm leading-relaxed'>{t('intro.credibilityIntro')}</p>
				</IntroSlide>
			),
		},
		{
			key: 'topic-tiers',
			content: (
				<IntroSlide icon={<Tags className='text-primary size-4' />} heading={t('intro.topicTiersHeading')}>
					<IntroExample
						src={`/intro/topic-badge-${localeSuffix}.png`}
						alt={t('intro.topicTiersImageAlt')}
						width={506}
						height={topicBadgeHeight}
						caption={t('intro.topicTiersCaption')}
					/>
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
					<IntroExample
						src={`/intro/source-card-${localeSuffix}.png`}
						alt={t('intro.sourceTiersImageAlt')}
						width={396}
						height={sourceCardHeight}
						caption={t('intro.sourceTiersCaption')}
					/>
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
		{
			key: 'candidates',
			content: (
				<IntroSlide icon={<Telescope className='text-primary size-4' />} heading={t('intro.candidatesHeading')}>
					<IntroExample
						src={`/intro/candidate-card-${localeSuffix}.png`}
						alt={t('intro.candidatesImageAlt')}
						width={780}
						height={128}
						caption={t('intro.candidatesCaption')}
					/>
					<p className='text-muted-foreground text-sm leading-relaxed'>{t('intro.candidatesBody')}</p>
				</IntroSlide>
			),
		},
	]

	return (
		<div className='flex h-full flex-col gap-6'>
			<p className='text-muted-foreground text-sm leading-relaxed sm:text-base'>{t('overview.subtitle')}</p>
			<div className='min-h-0 flex-1'>
				<Carousel slides={slides} />
			</div>
		</div>
	)
}

function IntroSlide({ icon, heading, children }: { icon: ReactNode; heading: string; children: ReactNode }) {
	return (
		<section className='bg-secondary/30 flex h-full flex-col justify-center gap-3 rounded-lg p-4 sm:p-5'>
			<h2 className='flex items-center gap-2 text-base font-medium'>
				{icon}
				{heading}
			</h2>
			{children}
		</section>
	)
}

function IntroExample({
	src,
	alt,
	width,
	height,
	caption,
}: {
	src: string
	alt: string
	width: number
	height: number
	caption: string
}) {
	return (
		<figure className='flex flex-col items-center gap-1.5 self-center'>
			<Image
				src={src}
				alt={alt}
				width={width}
				height={height}
				className='border-border h-auto max-w-[220px] rounded-lg border shadow-sm sm:max-w-[260px]'
			/>
			<figcaption className='text-muted-foreground max-w-[240px] text-center text-xs leading-snug'>
				{caption}
			</figcaption>
		</figure>
	)
}

function LinkCheckDiagram({ caption }: { caption: string }) {
	return (
		<figure className='flex flex-col items-center gap-2 self-center'>
			<div className='border-border bg-card flex items-center gap-3 rounded-lg border px-5 py-4 shadow-sm'>
				<Link2 className='text-muted-foreground size-5' />
				<span className='text-muted-foreground text-xs'>···</span>
				<Search className='text-muted-foreground size-5' />
				<span className='text-muted-foreground text-xs'>···</span>
				<CheckCircle2 className='text-success size-5' />
			</div>
			<figcaption className='text-muted-foreground max-w-[240px] text-center text-xs leading-snug'>
				{caption}
			</figcaption>
		</figure>
	)
}
