import { apiHandler, requireCron } from '@/lib/apiHandler'
import { prisma } from '@/lib/prisma'
import { researchEvent } from '@/lib/pipeline/research'
import { scoreEvent } from '@/lib/pipeline/score'
import { assignEventToTopic } from '@/lib/pipeline/topics'

// 事件研究是多步驟 agentic 流程。Vercel Hobby 函式上限 60s（Pro 可到 300s）。
// 在 Hobby 上每次只處理 1 個事件以免逾時；升級 Pro 後可調高 maxDuration 與 take。
export const maxDuration = 60

export const GET = apiHandler(async (req) => {
	requireCron(req)
	const pending = await prisma.event.findMany({ where: { status: 'PENDING_RESEARCH' }, take: 1 })
	const processed: string[] = []
	for (const event of pending) {
		await researchEvent(event.id)
		await scoreEvent(event.id)
		await assignEventToTopic(event.id)
		processed.push(event.id)
	}
	return { pending: pending.length, processed: processed.length }
})

export const POST = GET
