import { prisma } from '@/lib/prisma'
import { getT } from '@/i18n'
import { Breadcrumb } from '@/components/Breadcrumb'

export const dynamic = 'force-dynamic'

export default async function TopicBreadcrumb({
	params,
}: {
	params: Promise<{ lng: string; slug: string }>
}) {
	const { lng, slug } = await params
	const { t } = await getT(lng)
	const isZh = lng.startsWith('zh')

	const topic = await prisma.topic.findUnique({
		where: { slug },
		select: { titleZh: true, titleEn: true },
	})
	if (!topic) return null

	return (
		<Breadcrumb
			className='flex-nowrap'
			items={[{ label: t('nav.overview'), href: `/${lng}` }, { label: isZh ? topic.titleZh : topic.titleEn }]}
		/>
	)
}
