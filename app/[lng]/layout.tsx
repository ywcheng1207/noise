import type { ReactNode } from 'react'
import Link from 'next/link'
import { getT } from '@/i18n'
import { languages } from '@/i18n/settings'
import { BrandLogo } from '@/components/BrandLogo'
import { ScrollToTopButton } from '@/components/ScrollToTopButton'
import { DisclaimerModal } from './_components/DisclaimerModal'
import { LanguageSwitcher } from './_components/LanguageSwitcher'
import { TermsBreadcrumbGate } from './_components/TermsBreadcrumbGate'
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
		<div className='mx-auto flex h-dvh w-full max-w-6xl flex-col px-4 sm:px-6 lg:px-8'>
			<header className='flex shrink-0 items-center justify-between gap-3 py-4'>
				<Link href={`/${lng}`} className='flex shrink-0 items-center gap-2'>
					<BrandLogo />
					<span className='text-lg font-semibold tracking-wide'>{t('appName')}</span>
				</Link>
				<div className='flex shrink-0 items-center gap-1'>
					<ThemeToggle />
					<LanguageSwitcher lng={lng} />
				</div>
			</header>
			<main className='min-h-0 flex-1 scrollbar-thin overflow-y-auto py-6'>
				<TermsBreadcrumbGate lng={lng}>{breadcrumb}</TermsBreadcrumbGate>
				{children}
			</main>
			<footer className='border-border text-muted-foreground flex shrink-0 flex-col gap-1 border-t py-4 text-xs sm:flex-row sm:items-center sm:justify-between'>
				<Link href={`/${lng}/terms`} className='hover:text-foreground underline transition-colors'>
					{t('footer.terms')}
				</Link>
				<span>
					© {new Date().getFullYear()} {t('appName')} · {t('footer.rights')}
				</span>
			</footer>
			<ScrollToTopButton />
			<DisclaimerModal
				lng={lng}
				labels={{
					title: t('disclaimerModal.title'),
					body: t('disclaimerModal.body'),
					termsLink: t('disclaimerModal.termsLink'),
					dontShowToday: t('disclaimerModal.dontShowToday'),
					confirm: t('disclaimerModal.confirm'),
				}}
			/>
		</div>
	)
}
