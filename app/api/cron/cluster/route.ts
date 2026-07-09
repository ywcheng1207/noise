import { apiHandler, requireCron } from '@/lib/apiHandler'
import { runRouting } from '@/lib/pipeline/routing'

// 路徑沿用 /api/cron/cluster（避免另外去 Vercel 改排程設定），內部邏輯已改為分流（routing.ts）。
// 分流是單一大型 Gemini 呼叫，明確標滿 Hobby 函式上限以免逾時被截。
export const maxDuration = 60

export const GET = apiHandler(async (req) => {
	requireCron(req)
	return runRouting()
})

export const POST = GET
