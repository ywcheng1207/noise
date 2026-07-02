'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { languages } from '@/i18n/settings'
import { cn } from '@/lib/utils'

function buildLanguageHref(pathname: string, lng: string) {
	const segments = pathname.split('/')
	segments[1] = lng
	return segments.join('/')
}

export function LanguageSwitcher({ lng }: { lng: string }) {
	const pathname = usePathname()

	const options = languages.map((l) => ({
		value: l,
		href: buildLanguageHref(pathname, l),
		label: l === 'zh-Hant' ? '中' : 'EN',
	}))

	return (
		<nav className='flex items-center gap-1 text-sm'>
			{options.map((opt) => (
				<Link
					key={opt.value}
					href={opt.href}
					className={cn(
						'rounded-md px-2 py-1',
						opt.value === lng
							? 'bg-secondary text-foreground'
							: 'text-muted-foreground hover:text-foreground',
					)}
				>
					{opt.label}
				</Link>
			))}
		</nav>
	)
}
