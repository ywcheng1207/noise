'use client'

import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import useEmblaCarousel from 'embla-carousel-react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

import { cn } from '@/lib/utils'

export interface CarouselSlide {
	key: string
	content: ReactNode
}

export function Carousel({ slides }: { slides: CarouselSlide[] }) {
	const [emblaRef, emblaApi] = useEmblaCarousel({ align: 'start' })
	const [canScrollPrev, setCanScrollPrev] = useState(false)
	const [canScrollNext, setCanScrollNext] = useState(false)
	const [height, setHeight] = useState<number>()
	const slideRefs = useRef<Array<HTMLDivElement | null>>([])

	const handlePrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi])
	const handleNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi])

	useEffect(() => {
		if (!emblaApi) return
		function handleSelect() {
			if (!emblaApi) return
			setCanScrollPrev(emblaApi.canScrollPrev())
			setCanScrollNext(emblaApi.canScrollNext())
		}
		handleSelect()
		emblaApi.on('select', handleSelect)
		emblaApi.on('reInit', handleSelect)
		return () => {
			emblaApi.off('select', handleSelect)
			emblaApi.off('reInit', handleSelect)
		}
	}, [emblaApi])

	useEffect(() => {
		if (!emblaApi) return
		// 每張分頁內容長短不一,且同一張分頁在不同螢幕寬度下的實際高度也會變(文字換行位置不同)。
		// 直接用 ResizeObserver 盯著目前分頁元素本身的實際尺寸,而不是只在切換分頁當下量一次,
		// 才能涵蓋「切完分頁後使用者又縮放視窗」這種情況。
		let observer: ResizeObserver | undefined
		function observeActiveSlide() {
			if (!emblaApi) return
			observer?.disconnect()
			const activeSlide = slideRefs.current[emblaApi.selectedScrollSnap()]
			if (!activeSlide) return
			observer = new ResizeObserver(() => setHeight(activeSlide.offsetHeight))
			observer.observe(activeSlide)
		}
		observeActiveSlide()
		emblaApi.on('select', observeActiveSlide)
		emblaApi.on('reInit', observeActiveSlide)
		return () => {
			observer?.disconnect()
			emblaApi.off('select', observeActiveSlide)
			emblaApi.off('reInit', observeActiveSlide)
		}
	}, [emblaApi])

	return (
		<div aria-roledescription='carousel' className='flex items-center gap-2'>
			{/* 按鈕放在輪播圖左右兩側、垂直置中,不疊在卡片內容上——就不會有蓋住文字的問題,
			    也不需要再另外為手機隱藏。 */}
			<button
				type='button'
				onClick={handlePrev}
				aria-label='previous slide'
				className={cn(
					'bg-secondary text-secondary-foreground flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-full shadow-sm transition-all duration-200 hover:scale-110 hover:bg-secondary/80',
					!canScrollPrev && 'pointer-events-none opacity-0',
				)}
			>
				<ChevronLeft className='size-5' />
			</button>

			{/* 外層負責裁切高度(隨目前分頁動畫調整),內層才是 embla 真正量測/監看的 viewport——
			    兩者疊在同一個 DOM 節點的話,改高度會觸發 embla 自己的 resize 偵測進而 reInit,
			    reInit 又把捲動位置重算回去,點下一頁的效果當場被自己蓋掉,形成循環。 */}
			<div
				className='min-w-0 flex-1 overflow-hidden transition-[height] duration-300 ease-out'
				style={height ? { height } : undefined}
			>
				<div ref={emblaRef} className='overflow-hidden'>
					<div className='flex items-start'>
						{slides.map((slide, index) => (
							<div
								key={slide.key}
								ref={(el) => {
									slideRefs.current[index] = el
								}}
								role='group'
								aria-roledescription='slide'
								aria-label={`${index + 1} / ${slides.length}`}
								className='min-w-0 flex-[0_0_100%]'
							>
								{slide.content}
							</div>
						))}
					</div>
				</div>
			</div>

			<button
				type='button'
				onClick={handleNext}
				aria-label='next slide'
				className={cn(
					'bg-secondary text-secondary-foreground flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-full shadow-sm transition-all duration-200 hover:scale-110 hover:bg-secondary/80',
					!canScrollNext && 'pointer-events-none opacity-0',
				)}
			>
				<ChevronRight className='size-5' />
			</button>
		</div>
	)
}
