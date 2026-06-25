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
	const pending = await prisma.event.findMany({
		where: { status: 'PENDING_RESEARCH' },
		orderBy: { importanceScore: 'desc' },
		take: 1,
	})
	let processed = 0
	let failed = 0
	for (const event of pending) {
		try {
			await researchEvent(event.id)
			await scoreEvent(event.id)
			await assignEventToTopic(event.id)
			processed++
		} catch (error) {
			// 單一事件失敗（如 Gemini 接地回空）不應讓整個 cron 500；保留 PENDING_RESEARCH 下次重試。
			console.error('[cron/research] event failed', event.id, error)
			failed++
		}
	}
	return { pending: pending.length, processed, failed }
})

export const POST = GET
