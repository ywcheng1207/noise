import type { ReactNode } from 'react'
import Link from 'next/link'
import { Newspaper } from 'lucide-react'
import { getT } from '@/i18n'
import { languages } from '@/i18n/settings'
import { LanguageSwitcher } from './_components/LanguageSwitcher'

export function generateStaticParams() {
	return languages.map((lng) => ({ lng }))
}

export default async function LngLayout({
	children,
	params,
}: {
	children: ReactNode
	params: Promise<{ lng: string }>
}) {
	const { lng } = await params
	const { t } = await getT(lng)

	return (
		<div className='mx-auto flex min-h-screen max-w-3xl flex-col px-4'>
			<header className='flex items-center justify-between border-b border-border py-4'>
				<Link href={`/${lng}`} className='flex items-center gap-2 font-medium'>
					<Newspaper className='size-5 text-info' />
					<span>{t('appName')}</span>
				</Link>
				<LanguageSwitcher lng={lng} />
			</header>
			<main className='flex-1 py-6'>{children}</main>
			<footer className='border-t border-border py-4 text-xs text-muted-foreground'>
				{t('event.disclaimer')}
			</footer>
		</div>
	)
}
