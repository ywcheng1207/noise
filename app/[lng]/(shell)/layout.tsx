import type { ReactNode } from 'react'
import { getT } from '@/i18n'
import { TabShell } from './_components/TabShell'
import { IntroContent } from './_components/IntroContent'

export default async function ShellLayout({
	children,
	breadcrumb,
	params,
}: {
	children: ReactNode
	breadcrumb: ReactNode
	params: Promise<{ lng: string }>
}) {
	const { lng } = await params
	const { t } = await getT(lng)

	return (
		<TabShell
			lng={lng}
			labels={{
				intro: t('overview.introTab'),
				latest: t('nav.latest'),
				topics: t('overview.heading'),
				log: t('nav.log'),
			}}
			breadcrumb={breadcrumb}
			intro={<IntroContent lng={lng} />}
		>
			{children}
		</TabShell>
	)
}
