import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { prisma } from '@/lib/prisma'
import { getT } from '@/i18n'
import { Breadcrumb, type BreadcrumbItem } from '@/components/Breadcrumb'

export const dynamic = 'force-dynamic'

export default async function EventBreadcrumb({
	params,
	searchParams,
}: {
	params: Promise<{ lng: string; slug: string }>
	searchParams: Promise<{ fromLog?: string }>
}) {
	const { lng, slug } = await params
	const { fromLog } = await searchParams
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
			action={
				fromLog ? (
					<Link
						href={`/${lng}/log/${fromLog}`}
						className='text-muted-foreground hover:bg-secondary hover:text-foreground flex items-center gap-1 rounded-lg px-2 py-1 text-xs whitespace-nowrap transition-colors'
					>
						<ArrowLeft className='size-3.5' />
						{t('log.backToLog')}
					</Link>
				) : null
			}
		/>
	)
}
