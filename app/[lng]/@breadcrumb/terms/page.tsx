import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { getT } from '@/i18n'

export default async function TermsBackLink({ params }: { params: Promise<{ lng: string }> }) {
	const { lng } = await params
	const { t } = await getT(lng)

	return (
		<Link
			href={`/${lng}`}
			className='text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-sm transition-colors'
		>
			<ArrowLeft className='size-4' />
			{t('terms.backToPlatform')}
		</Link>
	)
}
