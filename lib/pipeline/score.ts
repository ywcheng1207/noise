import { prisma } from '@/lib/prisma'

const TIER_ORDER: Record<string, number> = {
	OFFICIAL: 0,
	HIGH: 1,
	MEDIUM: 2,
	LOW: 3,
	UNVERIFIED: 4,
}

/** 依可信度（官方優先 → tier）排序事件來源並寫回 rank。 */
export async function scoreEvent(eventId: string) {
	const sources = await prisma.eventSource.findMany({ where: { eventId } })

	const ranked = [...sources].sort((a, b) => {
		if (a.isAuthoritative !== b.isAuthoritative) return a.isAuthoritative ? -1 : 1
		return (TIER_ORDER[a.credibilityTier] ?? 9) - (TIER_ORDER[b.credibilityTier] ?? 9)
	})

	for (let i = 0; i < ranked.length; i++) {
		await prisma.eventSource.update({ where: { id: ranked[i].id }, data: { rank: i + 1 } })
	}

	return { eventId, ranked: ranked.length }
}
