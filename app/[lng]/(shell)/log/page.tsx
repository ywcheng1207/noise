import { prisma } from '@/lib/prisma'
import { getT } from '@/i18n'
import { formatOccurred } from '@/lib/dates'
import { LogList } from './_components/LogList'

export const dynamic = 'force-dynamic'

interface DayBucket {
	day: Date
	count: number
}

interface DayEntry {
	key: string
	date: Date
	articleCount: number
	researchCount: number
}

export default async function LogPage({ params }: { params: Promise<{ lng: string }> }) {
	const { lng } = await params
	const { t } = await getT(lng)

	const [articleDays, researchDays] = await Promise.all([
		prisma.$queryRaw<DayBucket[]>`
			SELECT ("fetchedAt" AT TIME ZONE 'UTC')::date AS day, count(*)::int AS count
			FROM "Article"
			GROUP BY day
			ORDER BY day DESC
			LIMIT 60
		`,
		prisma.$queryRaw<DayBucket[]>`
			SELECT ("createdAt" AT TIME ZONE 'UTC')::date AS day, count(*)::int AS count
			FROM "AiRun"
			WHERE stage = 'RESEARCH'
			GROUP BY day
			ORDER BY day DESC
			LIMIT 60
		`,
	])

	const byDay = new Map<string, DayEntry>()
	for (const row of articleDays) {
		const key = row.day.toISOString().slice(0, 10)
		byDay.set(key, { key, date: row.day, articleCount: row.count, researchCount: 0 })
	}
	for (const row of researchDays) {
		const key = row.day.toISOString().slice(0, 10)
		const existing = byDay.get(key)
		if (existing) existing.researchCount = row.count
		else byDay.set(key, { key, date: row.day, articleCount: 0, researchCount: row.count })
	}

	const entries = Array.from(byDay.values())
		.sort((a, b) => b.key.localeCompare(a.key))
		.slice(0, 30)

	const dateBounds = entries.length > 0 ? { from: entries[entries.length - 1].key, to: entries[0].key } : null

	const rows = entries.map((entry) => ({
		key: entry.key,
		dateLabel: formatOccurred({ lng, occurredAt: entry.date, precision: 'DAY' }) ?? entry.key,
		summaryLine: t('log.summaryLine', {
			articleCount: entry.articleCount,
			researchCount: entry.researchCount,
		}),
	}))

	return (
		<div className='mx-auto flex w-full max-w-3xl flex-col gap-5'>
			<div>
				<h1 className='text-xl font-medium lg:text-2xl'>{t('log.heading')}</h1>
				<p className='text-muted-foreground mt-1 text-sm leading-6'>{t('log.pageIntro')}</p>
			</div>

			<LogList
				lng={lng}
				rows={rows}
				dateBounds={dateBounds}
				labels={{ empty: t('log.empty'), dateRange: t('topic.dateRange') }}
			/>
		</div>
	)
}
