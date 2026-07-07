import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { getT } from '@/i18n'
import { LinkPendingSpinner } from '@/components/LinkPendingSpinner'
import { formatOccurred } from '@/lib/dates'

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

	return (
		<div className='mx-auto flex w-full max-w-3xl flex-col gap-5'>
			<div>
				<h1 className='text-xl font-medium lg:text-2xl'>{t('log.heading')}</h1>
				<p className='text-muted-foreground mt-1 text-sm leading-6'>{t('log.pageIntro')}</p>
			</div>

			{entries.length === 0 ? (
				<p className='text-muted-foreground py-8 text-center text-sm'>{t('log.empty')}</p>
			) : (
				<ol className='flex flex-col gap-2'>
					{entries.map((entry) => (
						<li key={entry.key}>
							<Link
								href={`/${lng}/log/${entry.key}`}
								className='bg-secondary/40 hover:bg-secondary/60 block rounded-lg p-4 backdrop-blur-md transition-all duration-200 hover:scale-[1.01]'
							>
								<div className='flex items-center gap-2'>
									<span className='font-medium'>
										{formatOccurred({ lng, occurredAt: entry.date, precision: 'DAY' })}
									</span>
									<LinkPendingSpinner />
								</div>
								<p className='text-muted-foreground mt-1 text-xs'>
									{t('log.summaryLine', {
										articleCount: entry.articleCount,
										researchCount: entry.researchCount,
									})}
								</p>
							</Link>
						</li>
					))}
				</ol>
			)}
		</div>
	)
}
