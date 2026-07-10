'use client'

import { useCallback, useEffect, useState, type ReactNode } from 'react'
import useEmblaCarousel from 'embla-carousel-react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

import { cn } from '@/lib/utils'

export interface IntroStep {
	key: string
	title: string
	content: ReactNode
}

export function IntroStepNavigator({ steps, stepLabel }: { steps: IntroStep[]; stepLabel: string }) {
	const [emblaRef, emblaApi] = useEmblaCarousel({ align: 'start' })
	const [selectedIndex, setSelectedIndex] = useState(0)
	const [canScrollPrev, setCanScrollPrev] = useState(false)
	const [canScrollNext, setCanScrollNext] = useState(false)

	const scrollTo = useCallback((index: number) => emblaApi?.scrollTo(index), [emblaApi])
	const handlePrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi])
	const handleNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi])

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

	const total = steps.length
	const activeStep = steps[selectedIndex]
	const stepNumber = String(selectedIndex + 1).padStart(2, '0')
	const totalNumber = String(total).padStart(2, '0')
	const progressPercent = ((selectedIndex + 1) / total) * 100

	return (
		<div className='flex h-full min-h-0 flex-col gap-4 lg:flex-row'>
			{/* 中小螢幕橫向可捲動的分段圓點導覽;桌機(lg+)才有空間放直向清單,兩者互斥顯示 */}
			<StepTabsRow steps={steps} activeIndex={selectedIndex} onSelect={scrollTo} className='lg:hidden' />
			<StepRail steps={steps} activeIndex={selectedIndex} onSelect={scrollTo} className='hidden lg:flex' />

			<div className='bg-secondary/30 flex min-h-0 min-w-0 flex-1 flex-col rounded-lg'>
				<div className='shrink-0 p-4 pb-0 sm:p-5 sm:pb-0'>
					<div className='flex items-center gap-3'>
						<span className='text-primary shrink-0 font-mono text-xs font-medium tracking-wide'>
							{stepLabel} {stepNumber} / {totalNumber}
						</span>
						<div className='bg-border relative h-px flex-1 overflow-hidden rounded-full'>
							<div
								className='bg-primary absolute inset-y-0 left-0 transition-[width] duration-300 ease-out'
								style={{ width: `${progressPercent}%` }}
							/>
						</div>
					</div>
					<h2 className='mt-2 text-base font-medium sm:text-lg'>{activeStep.title}</h2>
				</div>

				<div ref={emblaRef} className='min-h-0 flex-1 overflow-hidden'>
					<div className='flex h-full items-stretch'>
						{steps.map((step, index) => (
							<div
								key={step.key}
								role='tabpanel'
								aria-label={step.title}
								aria-hidden={index !== selectedIndex}
								className='flex h-full min-w-0 flex-[0_0_100%] flex-col items-center justify-center overflow-y-auto p-4 sm:p-5'
							>
								<div className='flex w-full max-w-2xl flex-col gap-3'>{step.content}</div>
							</div>
						))}
					</div>
				</div>

				<div className='flex shrink-0 items-center justify-center gap-4 p-4 sm:p-5'>
					<button
						type='button'
						onClick={handlePrev}
						aria-label='previous step'
						className={cn(
							'text-muted-foreground hover:bg-secondary hover:text-foreground flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-full transition-colors duration-200',
							!canScrollPrev && 'pointer-events-none opacity-0',
						)}
					>
						<ChevronLeft className='size-4' />
					</button>
					<div className='flex items-center gap-1.5'>
						{steps.map((step, index) => (
							<button
								key={step.key}
								type='button'
								onClick={() => scrollTo(index)}
								aria-label={step.title}
								aria-current={index === selectedIndex}
								className={cn(
									'h-1.5 cursor-pointer rounded-full transition-all duration-200',
									index === selectedIndex ? 'bg-primary w-5' : 'bg-border hover:bg-muted-foreground/40 w-1.5',
								)}
							/>
						))}
					</div>
					<button
						type='button'
						onClick={handleNext}
						aria-label='next step'
						className={cn(
							'text-muted-foreground hover:bg-secondary hover:text-foreground flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-full transition-colors duration-200',
							!canScrollNext && 'pointer-events-none opacity-0',
						)}
					>
						<ChevronRight className='size-4' />
					</button>
				</div>
			</div>
		</div>
	)
}

function StepRail({
	steps,
	activeIndex,
	onSelect,
	className,
}: {
	steps: IntroStep[]
	activeIndex: number
	onSelect: (index: number) => void
	className?: string
}) {
	return (
		<div role='tablist' className={cn('w-56 shrink-0 flex-col gap-1', className)}>
			{steps.map((step, index) => {
				const isActive = index === activeIndex
				return (
					<button
						key={step.key}
						type='button'
						role='tab'
						aria-selected={isActive}
						onClick={() => onSelect(index)}
						className={cn(
							'flex w-full cursor-pointer items-baseline gap-2.5 rounded-lg px-3 py-2.5 text-left text-sm transition-colors duration-200',
							isActive
								? 'bg-primary/10 text-primary font-medium'
								: 'text-muted-foreground hover:bg-secondary hover:text-foreground',
						)}
					>
						<span className='font-mono text-xs tabular-nums'>{String(index + 1).padStart(2, '0')}</span>
						<span className='min-w-0'>{step.title}</span>
					</button>
				)
			})}
		</div>
	)
}

function StepTabsRow({
	steps,
	activeIndex,
	onSelect,
	className,
}: {
	steps: IntroStep[]
	activeIndex: number
	onSelect: (index: number) => void
	className?: string
}) {
	return (
		<div role='tablist' className={cn('scrollbar-thin flex shrink-0 gap-1.5 overflow-x-auto pb-1', className)}>
			{steps.map((step, index) => {
				const isActive = index === activeIndex
				return (
					<button
						key={step.key}
						type='button'
						role='tab'
						aria-selected={isActive}
						aria-label={step.title}
						onClick={() => onSelect(index)}
						className={cn(
							'flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-full text-xs font-medium transition-colors duration-200',
							isActive
								? 'bg-primary text-primary-foreground'
								: 'bg-secondary text-muted-foreground hover:bg-secondary/70',
						)}
					>
						{index + 1}
					</button>
				)
			})}
		</div>
	)
}
