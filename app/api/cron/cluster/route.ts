import { apiHandler, requireCron } from '@/lib/apiHandler'
import { runCluster } from '@/lib/pipeline/cluster'

export const GET = apiHandler(async (req) => {
	requireCron(req)
	return runCluster()
})

export const POST = GET
