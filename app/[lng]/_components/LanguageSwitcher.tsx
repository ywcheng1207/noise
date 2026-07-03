'use client'

import { useTransition } from 'react'
import { usePathname, useRouter } from 'next/navigation'

import { languages } from '@/i18n/settings'
import { cn } from '@/lib/utils'

function buildLanguageHref(pathname: string, lng: string) {
	const segments = pathname.split('/')
	segments[1] = lng
	return segments.join('/')
}

export function LanguageSwitcher({ lng }: { lng: string }) {
	const pathname = usePathname()
	const router = useRouter()

	const [isPending, startTransition] = useTransition()

	const options = languages.map((l) => ({
		value: l,
		label: l === 'zh-Hant' ? '中' : 'EN',
	}))

	function handleSwitch(target: string) {
		if (target === lng) return
		startTransition(() => {
			router.push(buildLanguageHref(pathname, target))
		})
	}

	return (
		<nav className='flex items-center gap-1 text-sm'>
			{options.map((opt) => (
				<button
					key={opt.value}
					type='button'
					onClick={() => handleSwitch(opt.value)}
					className={cn(
						'cursor-pointer rounded-lg px-2 py-1 transition-colors',
						opt.value === lng
							? 'bg-secondary text-foreground'
							: 'text-muted-foreground hover:text-foreground',
						isPending && opt.value !== lng && 'animate-pulse',
					)}
				>
					{opt.label}
				</button>
			))}
		</nav>
	)
}
