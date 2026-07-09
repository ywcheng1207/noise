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
		<div aria-roledescription='carousel' className='relative'>
			<div ref={emblaRef} className='overflow-hidden'>
				<div className='flex items-stretch'>
					{slides.map((slide, index) => (
						<div
							key={slide.key}
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

			<button
				type='button'
				onClick={handlePrev}
				aria-label='previous slide'
				className={cn(
					'bg-background/90 text-foreground absolute top-1/2 left-2 flex size-9 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full shadow-md backdrop-blur-sm transition-all duration-200 hover:scale-110',
					!canScrollPrev && 'pointer-events-none opacity-0',
				)}
			>
				<ChevronLeft className='size-5' />
			</button>
			<button
				type='button'
				onClick={handleNext}
				aria-label='next slide'
				className={cn(
					'bg-background/90 text-foreground absolute top-1/2 right-2 flex size-9 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full shadow-md backdrop-blur-sm transition-all duration-200 hover:scale-110',
					!canScrollNext && 'pointer-events-none opacity-0',
				)}
			>
				<ChevronRight className='size-5' />
			</button>
		</div>
	)
}
