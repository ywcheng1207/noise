'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { format } from 'date-fns'

import { Checkbox } from '@/components/ui/checkbox'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'

const DISMISSED_DATE_STORAGE_KEY = 'noise-disclaimer-dismissed-date'

export interface DisclaimerModalLabels {
	title: string
	body: string
	termsLink: string
	dontShowToday: string
	confirm: string
}

export const DisclaimerModal = ({ lng, labels }: { lng: string; labels: DisclaimerModalLabels }) => {
	const [open, setOpen] = useState(false)
	const [dontShowToday, setDontShowToday] = useState(false)

	useEffect(() => {
		const today = format(new Date(), 'yyyy-MM-dd')
		if (window.localStorage.getItem(DISMISSED_DATE_STORAGE_KEY) !== today) setOpen(true)
	}, [])

	function handleOpenChange(nextOpen: boolean) {
		if (!nextOpen && dontShowToday) {
			window.localStorage.setItem(DISMISSED_DATE_STORAGE_KEY, format(new Date(), 'yyyy-MM-dd'))
		}
		setOpen(nextOpen)
	}

	return (
		<Dialog open={open} onOpenChange={handleOpenChange}>
			<DialogContent className='gap-5'>
				<DialogHeader>
					<DialogTitle>{labels.title}</DialogTitle>
				</DialogHeader>
				<p className='text-muted-foreground text-sm leading-relaxed'>{labels.body}</p>
				<Link
					href={`/${lng}/terms`}
					className='text-info -mt-3 text-xs underline underline-offset-2 transition-colors hover:text-foreground'
				>
					{labels.termsLink}
				</Link>
				<div className='flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between'>
					<label className='text-muted-foreground flex cursor-pointer items-center gap-2 text-sm'>
						<Checkbox
							checked={dontShowToday}
							onCheckedChange={(checked) => setDontShowToday(checked === true)}
						/>
						{labels.dontShowToday}
					</label>
					<button
						type='button'
						onClick={() => handleOpenChange(false)}
						className='bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer rounded-lg px-4 py-2 text-sm font-medium transition-colors'
					>
						{labels.confirm}
					</button>
				</div>
			</DialogContent>
		</Dialog>
	)
}
