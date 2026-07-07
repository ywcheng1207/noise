import type { ReactNode } from 'react'
import Link from 'next/link'
import { getT } from '@/i18n'
import { languages } from '@/i18n/settings'
import { BrandLogo } from '@/components/BrandLogo'
import { ScrollToTopButton } from '@/components/ScrollToTopButton'
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
			<header className='flex items-center justify-between gap-3 py-4'>
				<Link href={`/${lng}`} className='flex shrink-0 items-center gap-2'>
					<BrandLogo />
					<span className='text-lg font-semibold tracking-wide'>{t('appName')}</span>
				</Link>
				<div className='flex shrink-0 items-center gap-1'>
					<ThemeToggle />
					<LanguageSwitcher lng={lng} />
				</div>
			</header>
			<main className='flex-1 py-6'>
				{breadcrumb}
				{children}
			</main>
			<footer className='border-border text-muted-foreground flex flex-col gap-1 border-t py-4 text-xs sm:flex-row sm:items-center sm:justify-between'>
				<Link href={`/${lng}/terms`} className='hover:text-foreground underline transition-colors'>
					{t('footer.terms')}
				</Link>
				<span>
					© {new Date().getFullYear()} {t('appName')} · {t('footer.rights')}
				</span>
			</footer>
			<ScrollToTopButton />
		</div>
	)
}
