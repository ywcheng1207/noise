'use client'

import { useEffect, useState } from 'react'
import { ChevronsUp } from 'lucide-react'

import { cn } from '@/lib/utils'

const SCROLL_THRESHOLD = 400

export function ScrollToTopButton() {
	const [isVisible, setIsVisible] = useState(false)

	function handleClick() {
		window.scrollTo({ top: 0, behavior: 'smooth' })
	}

	useEffect(() => {
		function handleScroll() {
			setIsVisible(window.scrollY > SCROLL_THRESHOLD)
		}
		handleScroll()
		window.addEventListener('scroll', handleScroll, { passive: true })
		return () => window.removeEventListener('scroll', handleScroll)
	}, [])

	return (
		<button
			type='button'
			onClick={handleClick}
			aria-label='scroll to top'
			className={cn(
				'bg-primary text-primary-foreground fixed right-5 bottom-5 z-20 flex size-11 items-center justify-center rounded-full shadow-lg transition-all duration-300 hover:scale-110',
				isVisible ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-4 opacity-0',
			)}
		>
			<ChevronsUp className='animate-chevrons-float size-5' />
		</button>
	)
}
