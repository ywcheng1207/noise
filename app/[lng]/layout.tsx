import type { ReactNode } from 'react'
import Link from 'next/link'
import { Newspaper } from 'lucide-react'
import { getT } from '@/i18n'
import { languages } from '@/i18n/settings'
import { LanguageSwitcher } from './_components/LanguageSwitcher'
import { ThemeToggle } from './_components/ThemeToggle'

export function generateStaticParams() {
	return languages.map((lng) => ({ lng }))
}

export default async function LngLayout({
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
		<div className='mx-auto flex min-h-screen w-full max-w-6xl flex-col px-4 sm:px-6 lg:px-8'>
			<header className='border-border flex items-center justify-between gap-3 border-b py-4'>
				<div className='flex min-w-0 items-center gap-3'>
					<Link href={`/${lng}`} className='flex shrink-0 items-center gap-2 font-medium'>
						<Newspaper className='text-info size-5' />
						<span>{t('appName')}</span>
					</Link>
					<div className='hidden min-w-0 sm:block'>{breadcrumb}</div>
				</div>
				<div className='flex shrink-0 items-center gap-1'>
					<ThemeToggle />
					<LanguageSwitcher lng={lng} />
				</div>
			</header>
			<main className='flex-1 py-6'>{children}</main>
			<footer className='border-border text-muted-foreground border-t py-4 text-xs'>
				{t('event.disclaimer')}
			</footer>
		</div>
	)
}
