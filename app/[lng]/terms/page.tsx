import { getT } from '@/i18n'

export const dynamic = 'force-dynamic'

const SECTION_KEYS = [
	'nature',
	'copyright',
	'credibility',
	'disclaimer',
	'privacy',
	'conduct',
	'changes',
	'governingLaw',
	'contact',
] as const

export default async function TermsPage({ params }: { params: Promise<{ lng: string }> }) {
	const { lng } = await params
	const { t } = await getT(lng)

	return (
		<div className='mx-auto flex w-full max-w-3xl flex-col gap-6'>
			<div>
				<h1 className='text-xl font-medium lg:text-2xl'>{t('terms.heading')}</h1>
				<p className='text-muted-foreground mt-1 text-xs'>{t('terms.lastUpdated')}</p>
			</div>

			<p className='text-sm leading-7'>{t('terms.intro')}</p>

			<div className='flex flex-col gap-5'>
				{SECTION_KEYS.map((key) => (
					<section key={key}>
						<h2 className='mb-2 font-medium'>{t(`terms.${key}Heading`)}</h2>
						<p className='text-muted-foreground text-sm leading-7'>{t(`terms.${key}Body`)}</p>
					</section>
				))}
			</div>
		</div>
	)
}
