import { apiHandler, requireCron } from '@/lib/apiHandler'
import { consolidateTopics } from '@/lib/pipeline/topics'

export const GET = apiHandler(async (req) => {
	requireCron(req)
	return consolidateTopics()
})

export const POST = GET
