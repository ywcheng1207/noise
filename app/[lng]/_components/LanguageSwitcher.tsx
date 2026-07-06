'use client'

import { useTransition } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { Globe } from 'lucide-react'

import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { languages } from '@/i18n/settings'
import { cn } from '@/lib/utils'

const LANGUAGE_LABELS: Record<string, string> = {
	'zh-Hant': '中文',
	en: 'English',
}

function buildLanguageHref(pathname: string, lng: string) {
	const segments = pathname.split('/')
	segments[1] = lng
	return segments.join('/')
}

export function LanguageSwitcher({ lng }: { lng: string }) {
	const pathname = usePathname()
	const router = useRouter()

	const [isPending, startTransition] = useTransition()

	function handleSwitch(target: string) {
		if (target === lng) return
		startTransition(() => {
			router.push(buildLanguageHref(pathname, target))
		})
	}

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<button
					type='button'
					aria-label='switch language'
					className={cn(
						'text-muted-foreground hover:bg-secondary hover:text-foreground flex cursor-pointer items-center gap-1 rounded-lg px-2 py-1.5 text-xs transition-colors',
						isPending && 'animate-pulse',
					)}
				>
					<Globe className='size-4' />
					<span>{lng === 'zh-Hant' ? '中' : 'EN'}</span>
				</button>
			</DropdownMenuTrigger>
			<DropdownMenuContent>
				{languages.map((l) => (
					<DropdownMenuItem key={l} isActive={l === lng} onSelect={() => handleSwitch(l)}>
						{LANGUAGE_LABELS[l]}
					</DropdownMenuItem>
				))}
			</DropdownMenuContent>
		</DropdownMenu>
	)
}
