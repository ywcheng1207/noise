import { getT } from '@/i18n'
import { Breadcrumb } from '@/components/Breadcrumb'
import { formatOccurred } from '@/lib/dates'

export default async function LogDayBreadcrumb({
	params,
}: {
	params: Promise<{ lng: string; date: string }>
}) {
	const { lng, date } = await params
	const { t } = await getT(lng)
	const dayLabel = formatOccurred({ lng, occurredAt: new Date(`${date}T00:00:00.000Z`), precision: 'DAY' })

	return (
		<Breadcrumb
			className='flex-nowrap'
			items={[
				{ label: t('nav.overview'), href: `/${lng}` },
				{ label: t('nav.log'), href: `/${lng}/log` },
				{ label: dayLabel ?? date },
			]}
		/>
	)
}
