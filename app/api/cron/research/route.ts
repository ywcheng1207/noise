import { apiHandler, requireCron } from '@/lib/apiHandler'
import { prisma } from '@/lib/prisma'
import {
	closeStaleEvents,
	findEventsNeedingRefresh,
	refreshEvent,
	researchEvent,
} from '@/lib/pipeline/research'
import { scoreEvent } from '@/lib/pipeline/score'
import { isOverDailyBudget } from '@/lib/pipeline/budget'

// 事件研究是多步驟 agentic 流程。Vercel Hobby 函式上限 60s（Pro 可到 300s）。
// 在 Hobby 上每次只處理 1 個事件以免逾時；升級 Pro 後可調高 maxDuration 與 take。
export const maxDuration = 60

export const GET = apiHandler(async (req) => {
	requireCron(req)

	// 純 DB 操作、無 AI 成本，每次都跑，不受每日預算熔斷影響。
	const { closed } = await closeStaleEvents()

	if (await isOverDailyBudget()) {
		return { closed, pending: 0, refreshed: 0, processed: 0, failed: 0, skippedByBudget: true }
	}

	// topicId 已在分流（routing.ts）階段直接寫入，這裡不再需要另一次歸類呼叫。
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
			processed++
		} catch (error) {
			// 單一事件失敗（如 Gemini 接地回空）不應讓整個 cron 500；保留 PENDING_RESEARCH 下次重試。
			console.error('[cron/research] event failed', event.id, error)
			failed++
		}
	}

	// 完整研究優先；沒有待研究事件時，這次 tick 才處理累積續報達門檻的輕量研究佇列。
	let refreshed = 0
	if (pending.length === 0) {
		const needsRefresh = await findEventsNeedingRefresh(1)
		for (const event of needsRefresh) {
			try {
				await refreshEvent(event.id)
				await scoreEvent(event.id)
				refreshed++
			} catch (error) {
				console.error('[cron/research] refresh failed', event.id, error)
				failed++
			}
		}
	}

	return { closed, pending: pending.length, processed, refreshed, failed }
})

export const POST = GET
