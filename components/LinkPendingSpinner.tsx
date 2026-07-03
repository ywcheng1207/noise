'use client'

import { useLinkStatus } from 'next/link'
import { Loader2 } from 'lucide-react'

import { cn } from '@/lib/utils'

/** 放在 <Link> 內:導航進行中顯示小 spinner,取代整頁 loading 的替換感。 */
export function LinkPendingSpinner({ className }: { className?: string }) {
	const { pending } = useLinkStatus()

	if (!pending) return null
	return <Loader2 className={cn('text-muted-foreground size-3.5 animate-spin', className)} />
}
