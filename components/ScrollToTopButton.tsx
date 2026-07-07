'use client'

import { useEffect, useRef, useState } from 'react'
import { ChevronsUp } from 'lucide-react'

import { cn } from '@/lib/utils'

const SCROLL_THRESHOLD = 400
const SCROLL_DURATION_MS = 300

// 有虛擬清單的頁面,捲動容器的 scrollHeight 會隨列被量測而微調,瀏覽器原生的
// behavior:'smooth' 有時會被這個過程打斷、卡在半路。自己用 rAF 控制回頂部動畫,
// 目標固定是 0,不受清單量測影響。
function animateScrollToTop(element: HTMLElement) {
	const start = element.scrollTop
	const startTime = performance.now()

	function step(now: number) {
		const progress = Math.min((now - startTime) / SCROLL_DURATION_MS, 1)
		const eased = 1 - (1 - progress) * (1 - progress)
		element.scrollTop = start * (1 - eased)
		if (progress < 1) requestAnimationFrame(step)
	}
	requestAnimationFrame(step)
}

// 頁面本身不再捲動(main / 分頁內容區各自內部捲動),實際捲動的元素會隨頁面而異,
// 所以在 document 用 capture 監聽(scroll 事件不冒泡,但捲動階段仍會經過祖先節點),
// 用 event.target 找出當下真正在捲動的元素。
export function ScrollToTopButton() {
	const [isVisible, setIsVisible] = useState(false)
	const scrolledElementRef = useRef<HTMLElement | null>(null)

	function handleClick() {
		if (scrolledElementRef.current) animateScrollToTop(scrolledElementRef.current)
	}

	useEffect(() => {
		function handleScroll(event: Event) {
			if (!(event.target instanceof HTMLElement)) return
			scrolledElementRef.current = event.target
			setIsVisible(event.target.scrollTop > SCROLL_THRESHOLD)
		}
		document.addEventListener('scroll', handleScroll, { capture: true, passive: true })
		return () => document.removeEventListener('scroll', handleScroll, true)
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
