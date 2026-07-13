'use client'

import type { ComponentProps } from 'react'
import { X } from 'lucide-react'
import * as DialogPrimitive from '@radix-ui/react-dialog'

import { cn } from '@/lib/utils'

export const Dialog = DialogPrimitive.Root

export const DialogPortal = DialogPrimitive.Portal

export const DialogClose = DialogPrimitive.Close

export const DialogOverlay = ({ className, ...props }: ComponentProps<typeof DialogPrimitive.Overlay>) => {
	return (
		<DialogPrimitive.Overlay
			className={cn(
				'fixed inset-0 z-50 bg-black/50 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0',
				className,
			)}
			{...props}
		/>
	)
}

export const DialogContent = ({
	className,
	children,
	showCloseButton = true,
	...props
}: ComponentProps<typeof DialogPrimitive.Content> & { showCloseButton?: boolean }) => {
	return (
		<DialogPortal>
			<DialogOverlay />
			<DialogPrimitive.Content
				className={cn(
					'bg-card fixed top-[50%] left-[50%] z-50 grid w-full max-w-[calc(100%-2rem)] translate-x-[-50%] translate-y-[-50%] gap-4 rounded-lg border p-6 shadow-lg duration-200 outline-none data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 sm:max-w-lg',
					className,
				)}
				{...props}
			>
				{children}
				{showCloseButton ? (
					<DialogPrimitive.Close className='text-muted-foreground hover:bg-secondary hover:text-foreground absolute top-4 right-4 flex size-6 items-center justify-center rounded-lg opacity-70 transition-colors hover:opacity-100'>
						<X className='size-4' />
						<span className='sr-only'>Close</span>
					</DialogPrimitive.Close>
				) : null}
			</DialogPrimitive.Content>
		</DialogPortal>
	)
}

export const DialogHeader = ({ className, ...props }: ComponentProps<'div'>) => {
	return <div className={cn('flex flex-col gap-2 text-center sm:text-left', className)} {...props} />
}

export const DialogFooter = ({ className, ...props }: ComponentProps<'div'>) => {
	return <div className={cn('flex flex-col-reverse gap-2 sm:flex-row sm:justify-end', className)} {...props} />
}

export const DialogTitle = ({ className, ...props }: ComponentProps<typeof DialogPrimitive.Title>) => {
	return <DialogPrimitive.Title className={cn('text-lg leading-none font-semibold', className)} {...props} />
}

export const DialogDescription = ({ className, ...props }: ComponentProps<typeof DialogPrimitive.Description>) => {
	return <DialogPrimitive.Description className={cn('text-muted-foreground text-sm', className)} {...props} />
}
