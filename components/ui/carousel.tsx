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
	const [selectedIndex, setSelectedIndex] = useState(0)
	const [canScrollPrev, setCanScrollPrev] = useState(false)
	const [canScrollNext, setCanScrollNext] = useState(false)

	const handlePrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi])
	const handleNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi])
	const handleDotSelect = useCallback((index: number) => emblaApi?.scrollTo(index), [emblaApi])

	useEffect(() => {
		if (!emblaApi) return
		function handleSelect() {
			if (!emblaApi) return
			setSelectedIndex(emblaApi.selectedScrollSnap())
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
		<div aria-roledescription='carousel' className='flex flex-col gap-3'>
			<div ref={emblaRef} className='overflow-hidden'>
				<div className='flex items-start'>
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

			<div className='flex items-center justify-center gap-4'>
				<button
					type='button'
					onClick={handlePrev}
					disabled={!canScrollPrev}
					aria-label='previous slide'
					className='text-muted-foreground hover:bg-secondary hover:text-foreground flex size-7 cursor-pointer items-center justify-center rounded-lg transition-all duration-150 hover:scale-105 disabled:pointer-events-none disabled:opacity-30'
				>
					<ChevronLeft className='size-4' />
				</button>
				<div className='flex items-center gap-1.5'>
					{slides.map((slide, index) => {
						const isActive = index === selectedIndex
						return (
							<button
								key={slide.key}
								type='button'
								onClick={() => handleDotSelect(index)}
								aria-label={`slide ${index + 1}`}
								className={cn(
									'h-1.5 cursor-pointer rounded-full transition-all duration-300',
									isActive ? 'bg-primary w-5' : 'bg-muted-foreground/30 hover:bg-muted-foreground/50 w-1.5',
								)}
							/>
						)
					})}
				</div>
				<button
					type='button'
					onClick={handleNext}
					disabled={!canScrollNext}
					aria-label='next slide'
					className='text-muted-foreground hover:bg-secondary hover:text-foreground flex size-7 cursor-pointer items-center justify-center rounded-lg transition-all duration-150 hover:scale-105 disabled:pointer-events-none disabled:opacity-30'
				>
					<ChevronRight className='size-4' />
				</button>
			</div>
		</div>
	)
}
