import { apiHandler, requireCron } from '@/lib/apiHandler'
import { prisma } from '@/lib/prisma'
import { researchEvent } from '@/lib/pipeline/research'
import { scoreEvent } from '@/lib/pipeline/score'
import { assignEventToTopic } from '@/lib/pipeline/topics'

// 事件研究是多步驟 agentic 流程，拉高執行時間上限（Vercel Fluid Compute）。
export const maxDuration = 300

export const GET = apiHandler(async (req) => {
	requireCron(req)
	const pending = await prisma.event.findMany({ where: { status: 'PENDING_RESEARCH' }, take: 5 })
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
