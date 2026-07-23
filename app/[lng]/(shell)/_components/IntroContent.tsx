import Image from 'next/image'
import { CheckCircle2, Link2, Search } from 'lucide-react'
import { getT } from '@/i18n'
import { Badge } from '@/components/Badge'
import { ReliabilityBadge } from '@/components/ReliabilityBadge'
import { IntroStepNavigator, type IntroStep } from './IntroStepNavigator'
import { LIFECYCLE_ICON, LIFECYCLE_VARIANT, TIER_ICON, TIER_VARIANT } from '@/lib/ui'
import { RELIABILITIES, TIERS } from '@/lib/enums'

const LIFECYCLE_STATES = ['DORMANT', 'ARCHIVED'] as const

export async function IntroContent({ lng }: { lng: string }) {
	const { t } = await getT(lng)
	const isZh = lng.startsWith('zh')
	const localeSuffix = isZh ? 'zh-hant' : 'en'
	const sourceCardHeight = isZh ? 132 : 152
	const topicBadgeHeight = isZh ? 52 : 76
	const charterCardHeight = isZh ? 364 : 470
	const latestCardWidth = 1536
	const latestCardHeight = isZh ? 592 : 634

	const steps: IntroStep[] = [
		{
			key: 'pipeline',
			title: t('intro.pipelineHeading'),
			content: (
				<>
					<IntroExample
						src={`/intro/topic-card-${localeSuffix}.png`}
						alt={t('intro.pipelineImageAlt')}
						width={828}
						height={189}
						caption={t('intro.pipelineCaption')}
					/>
					<p className='text-muted-foreground text-sm leading-relaxed'>{t('intro.pipelineBody')}</p>
				</>
			),
		},
		{
			key: 'latest',
			title: t('intro.latestHeading'),
			content: (
				<>
					<IntroExample
						src={`/intro/latest-card-${localeSuffix}.png`}
						alt={t('intro.latestImageAlt')}
						width={latestCardWidth}
						height={latestCardHeight}
						caption={t('intro.latestCaption')}
					/>
					<p className='text-muted-foreground text-sm leading-relaxed'>{t('intro.latestBody')}</p>
				</>
			),
		},
		{
			key: 'charter',
			title: t('intro.charterHeading'),
			content: (
				<>
					<IntroExample
						src={`/intro/charter-card-${localeSuffix}.png`}
						alt={t('intro.charterImageAlt')}
						width={604}
						height={charterCardHeight}
						caption={t('intro.charterCaption')}
					/>
					<p className='text-muted-foreground text-sm leading-relaxed'>{t('intro.charterBody')}</p>
				</>
			),
		},
		{
			key: 'link-check',
			title: t('intro.linkCheckHeading'),
			content: (
				<>
					<LinkCheckDiagram caption={t('intro.linkCheckCaption')} />
					<p className='text-muted-foreground text-sm leading-relaxed'>{t('intro.linkCheckBody')}</p>
				</>
			),
		},
		{
			key: 'credibility',
			title: t('intro.credibilityHeading'),
			content: (
				<>
					<IntroExample
						src={`/intro/source-card-${localeSuffix}.png`}
						alt={t('intro.credibilityImageAlt')}
						width={396}
						height={sourceCardHeight}
						caption={t('intro.credibilityCaption')}
					/>
					<p className='text-muted-foreground text-sm leading-relaxed'>{t('intro.credibilityIntro')}</p>
				</>
			),
		},
		{
			key: 'topic-tiers',
			title: t('intro.topicTiersHeading'),
			content: (
				<>
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
								<ReliabilityBadge reliability={key} label={t(`reliability.${key}`)} className='mt-0.5 shrink-0' />
								<span className='text-muted-foreground'>{t(`intro.topicTier.${key}`)}</span>
							</li>
						))}
					</ul>
				</>
			),
		},
		{
			key: 'lifecycle',
			title: t('intro.lifecycleHeading'),
			content: (
				<>
					<IntroExample
						src={`/intro/lifecycle-badge-${localeSuffix}.png`}
						alt={t('intro.lifecycleImageAlt')}
						width={552}
						height={36}
						caption={t('intro.lifecycleCaption')}
					/>
					<ul className='flex flex-col gap-1.5'>
						<li className='flex items-start gap-2 text-sm'>
							<span className='border-muted-foreground/40 text-muted-foreground mt-0.5 inline-flex shrink-0 items-center rounded-lg border border-dashed px-2 py-0.5 text-xs font-medium'>
								{t('topic.lifecycle.ACTIVE')}
							</span>
							<span className='text-muted-foreground'>{t('intro.lifecycleState.ACTIVE')}</span>
						</li>
						{LIFECYCLE_STATES.map((key) => {
							const LifecycleIcon = LIFECYCLE_ICON[key]
							return (
								<li key={key} className='flex items-start gap-2 text-sm'>
									<Badge variant={LIFECYCLE_VARIANT[key] ?? 'muted'} className='mt-0.5 shrink-0'>
										<LifecycleIcon className='size-3' />
										{t(`topic.lifecycle.${key}`)}
									</Badge>
									<span className='text-muted-foreground'>{t(`intro.lifecycleState.${key}`)}</span>
								</li>
							)
						})}
					</ul>
				</>
			),
		},
		{
			key: 'source-tiers',
			title: t('intro.sourceTiersHeading'),
			content: (
				<>
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
				</>
			),
		},
		{
			key: 'candidates',
			title: t('intro.candidatesHeading'),
			content: (
				<>
					<IntroExample
						src={`/intro/candidate-card-${localeSuffix}.png`}
						alt={t('intro.candidatesImageAlt')}
						width={780}
						height={128}
						caption={t('intro.candidatesCaption')}
					/>
					<p className='text-muted-foreground text-sm leading-relaxed'>{t('intro.candidatesBody')}</p>
				</>
			),
		},
	]

	return (
		<div className='flex h-full flex-col gap-6'>
			<div className='flex flex-col gap-1.5'>
				<p className='text-muted-foreground text-sm leading-relaxed sm:text-base'>{t('overview.subtitle')}</p>
				<p className='text-muted-foreground/70 text-xs leading-relaxed'>{t('overview.subtitleNote')}</p>
			</div>
			<div className='min-h-0 flex-1'>
				<IntroStepNavigator steps={steps} stepLabel={t('intro.stepLabel')} />
			</div>
		</div>
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
				className='border-border h-auto max-w-[280px] rounded-lg border shadow-sm sm:max-w-[340px]'
			/>
			<figcaption className='text-muted-foreground max-w-[300px] text-center text-xs leading-snug'>
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
