import { prisma } from '@/lib/prisma'
import { getT } from '@/i18n'
import { Breadcrumb, type BreadcrumbItem } from '@/components/Breadcrumb'

export const dynamic = 'force-dynamic'

export default async function EventBreadcrumb({
	params,
}: {
	params: Promise<{ lng: string; slug: string }>
}) {
	const { lng, slug } = await params
	const { t } = await getT(lng)
	const isZh = lng.startsWith('zh')

	const event = await prisma.event.findUnique({
		where: { slug },
		select: {
			titleZh: true,
			titleEn: true,
			topic: { select: { slug: true, titleZh: true, titleEn: true } },
		},
	})
	if (!event) return null

	const topicCrumb: BreadcrumbItem[] = event.topic
		? [
				{
					label: isZh ? event.topic.titleZh : event.topic.titleEn,
					href: `/${lng}/topic/${event.topic.slug}`,
				},
			]
		: []

	return (
		<Breadcrumb
			className='flex-nowrap'
			items={[
				{ label: t('nav.overview'), href: `/${lng}` },
				...topicCrumb,
				{ label: isZh ? event.titleZh : event.titleEn },
			]}
		/>
	)
}
