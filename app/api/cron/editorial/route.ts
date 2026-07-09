import { apiHandler, requireCron } from '@/lib/apiHandler'
import { runEditorialMeeting } from '@/lib/pipeline/governance'

// 每日一次：脈絡生命週期治理（休眠/封存）+ 候選池轉正/淘汰。呼叫頻率固定，不隨文章量增加。
export const GET = apiHandler(async (req) => {
	requireCron(req)
	return runEditorialMeeting()
})

export const POST = GET
