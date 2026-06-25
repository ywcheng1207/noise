/* 一次性清除非聚焦網域（POLITICS/BIZ/INTL/TECH 以外）的議題與事件。用法：pnpm tsx scripts/purge-offdomain.ts */
import { prisma } from '../lib/prisma'
import { FOCUS_DOMAINS } from '../lib/enums'

async function main() {
	const focus = [...FOCUS_DOMAINS]

	const events = await prisma.event.deleteMany({ where: { domain: { notIn: focus } } })
	const topics = await prisma.topic.deleteMany({ where: { domain: { notIn: focus } } })
	const articles = await prisma.article.updateMany({
		where: { status: 'CLUSTERED', eventId: null },
		data: { status: 'SKIPPED' },
	})

	console.log(`purged ${events.count} events, ${topics.count} topics; reclaimed ${articles.count} orphan articles`)
}

main()
	.catch((err) => {
		console.error(err)
		process.exit(1)
	})
	.finally(() => prisma.$disconnect())
