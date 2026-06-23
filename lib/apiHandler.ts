import { NextRequest, NextResponse } from 'next/server'
import type { ApiResponse } from '@/types/api'

type RouteHandler<T> = (req: NextRequest) => Promise<T>

/**
 * API Route 統一包裝（Hard Rule：API route 一律用 apiHandler）。
 * 成功回傳 { success: true, data }；錯誤遮蔽訊息回 500。
 */
export function apiHandler<T>(handler: RouteHandler<T>) {
	return async (req: NextRequest): Promise<NextResponse<ApiResponse<T>>> => {
		try {
			const data = await handler(req)
			return NextResponse.json({ success: true, data })
		} catch (err) {
			const message = err instanceof Error ? err.message : 'Internal error'
			console.error('[apiHandler]', req.nextUrl.pathname, message)
			const status = message === 'Unauthorized' ? 401 : 500
			return NextResponse.json(
				{ success: false, error: status === 401 ? 'Unauthorized' : 'Internal server error' },
				{ status },
			)
		}
	}
}

/** Vercel Cron 觸發保護：設了 CRON_SECRET 才驗證（本地開發可不設）。 */
export function requireCron(req: NextRequest) {
	const secret = process.env.CRON_SECRET
	if (!secret) return
	if (req.headers.get('authorization') !== `Bearer ${secret}`) {
		throw new Error('Unauthorized')
	}
}
