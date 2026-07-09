import { THREAD_CONFIG } from '@/lib/pipeline/config'
import type { Reliability } from '@/lib/generated/prisma'

/**
 * 續報累積到一定獨立來源數，代表「這件事有多個來源佐證」是可以直接算出來的客觀事實，
 * 不需要 AI 重新評估——純規則升級可信度標記，不呼叫模型。
 */
export function upgradeReliabilityForCorroboration(
	current: Reliability,
	corroborationCount: number,
): Reliability {
	if (current === 'UNVERIFIED' && corroborationCount >= 1) return 'DEVELOPING'
	if (current === 'DEVELOPING' && corroborationCount >= THREAD_CONFIG.REFRESH_THRESHOLD) return 'VERIFIED'
	return current
}
