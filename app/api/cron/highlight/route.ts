import { apiHandler, requireCron } from '@/lib/apiHandler'
import { runHighlight } from '@/lib/pipeline/highlight'

export const maxDuration = 60

export const GET = apiHandler(async (req) => {
	requireCron(req)
	return runHighlight()
})

export const POST = GET
