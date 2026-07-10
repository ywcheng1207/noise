'use client'

import { useCallback, useEffect, useState, type ReactNode } from 'react'
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

	return (
		<div aria-roledescription='carousel' className='flex h-full items-center gap-2'>
			{/* 按鈕放在輪播圖左右兩側、垂直置中,不疊在卡片內容上;中小螢幕改靠滑動切換,
			    大螢幕才顯示按鈕。 */}
			<button
				type='button'
				onClick={handlePrev}
				aria-label='previous slide'
				className={cn(
					'bg-secondary text-secondary-foreground hidden size-9 shrink-0 cursor-pointer items-center justify-center rounded-full shadow-sm transition-all duration-200 hover:scale-110 hover:bg-secondary/80 lg:flex',
					!canScrollPrev && 'pointer-events-none opacity-0',
				)}
			>
				<ChevronLeft className='size-5' />
			</button>

			{/* 容器高度直接跟著上層(分頁面板)延展,每張分頁一律 h-full 撐滿、
			    內容在各自卡片裡垂直置中——不再需要量測個別分頁高度。 */}
			<div ref={emblaRef} className='h-full min-w-0 flex-1 overflow-hidden'>
				<div className='flex h-full items-stretch'>
					{slides.map((slide, index) => (
						<div
							key={slide.key}
							role='group'
							aria-roledescription='slide'
							aria-label={`${index + 1} / ${slides.length}`}
							className='h-full min-w-0 flex-[0_0_100%]'
						>
							{slide.content}
						</div>
					))}
				</div>
			</div>

			<button
				type='button'
				onClick={handleNext}
				aria-label='next slide'
				className={cn(
					'bg-secondary text-secondary-foreground hidden size-9 shrink-0 cursor-pointer items-center justify-center rounded-full shadow-sm transition-all duration-200 hover:scale-110 hover:bg-secondary/80 lg:flex',
					!canScrollNext && 'pointer-events-none opacity-0',
				)}
			>
				<ChevronRight className='size-5' />
			</button>
		</div>
	)
}
