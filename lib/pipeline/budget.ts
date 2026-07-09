import { prisma } from '@/lib/prisma'
import { THREAD_CONFIG } from '@/lib/pipeline/config'

/**
 * 每日成本熔斷：完整研究/輕量研究/編輯會議/脈絡收斂在觸發前都要檢查。
 * 分流不受此限——分流是分類判斷，不能因為預算就停止讀懂新文章，且分流本身呼叫成本低。
 */
export async function isOverDailyBudget(): Promise<boolean> {
	const startOfDayUtc = new Date()
	startOfDayUtc.setUTCHours(0, 0, 0, 0)

	const result = await prisma.aiRun.aggregate({
		where: { createdAt: { gte: startOfDayUtc } },
		_sum: { costUsd: true },
	})

	return (result._sum.costUsd ?? 0) >= THREAD_CONFIG.DAILY_BUDGET_USD
}
