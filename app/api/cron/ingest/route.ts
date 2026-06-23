import { apiHandler, requireCron } from '@/lib/apiHandler'
import { runIngest } from '@/lib/pipeline/ingest'

export const GET = apiHandler(async (req) => {
	requireCron(req)
	return runIngest()
})

export const POST = GET
