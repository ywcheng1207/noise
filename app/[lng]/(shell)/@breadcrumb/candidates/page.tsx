import { getT } from '@/i18n'
import { Breadcrumb } from '@/components/Breadcrumb'

export default async function CandidatesBreadcrumb({ params }: { params: Promise<{ lng: string }> }) {
	const { lng } = await params
	const { t } = await getT(lng)

	return (
		<Breadcrumb
			className='flex-nowrap'
			items={[{ label: t('nav.overview'), href: `/${lng}` }, { label: t('overview.candidatePool') }]}
		/>
	)
}
