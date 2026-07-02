'use client'

import { useEffect, useState } from 'react'
import { useTheme } from 'next-themes'
import { Moon, Sun } from 'lucide-react'

export function ThemeToggle() {
	const { resolvedTheme, setTheme } = useTheme()

	const [mounted, setMounted] = useState(false)

	const isDark = resolvedTheme === 'dark'

	function handleToggle() {
		setTheme(isDark ? 'light' : 'dark')
	}

	useEffect(() => {
		setMounted(true)
	}, [])

	return (
		<button
			type='button'
			onClick={handleToggle}
			aria-label='toggle theme'
			className='text-muted-foreground hover:bg-secondary hover:text-foreground flex size-8 cursor-pointer items-center justify-center rounded-md transition-colors'
		>
			{mounted ? (
				isDark ? (
					<Sun className='size-4' />
				) : (
					<Moon className='size-4' />
				)
			) : (
				<Moon className='size-4' />
			)}
		</button>
	)
}
