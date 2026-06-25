import { apiHandler, requireCron } from '@/lib/apiHandler'
import { runCluster } from '@/lib/pipeline/cluster'

// 分群是單一大型 Gemini 呼叫，明確標滿 Hobby 函式上限以免逾時被截。
export const maxDuration = 60

export const GET = apiHandler(async (req) => {
	requireCron(req)
	return runCluster()
})

export const POST = GET
