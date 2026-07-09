import { apiHandler, requireCron } from '@/lib/apiHandler'
import { consolidateTopics } from '@/lib/pipeline/topics'
import { isOverDailyBudget } from '@/lib/pipeline/budget'

export const GET = apiHandler(async (req) => {
	requireCron(req)
	if (await isOverDailyBudget()) return { merged: 0, details: [], skippedByBudget: true }
	return consolidateTopics()
})

export const POST = GET
