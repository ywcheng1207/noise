/* 載入示範資料：來源 + 核心議題 + 事件（以色列—伊朗議題含完整時序/來源）。用法：pnpm seed */
import { prisma } from '../lib/prisma'

const SOURCES = [
	{ name: 'BBC World', url: 'https://feeds.bbci.co.uk/news/world/rss.xml', language: 'en' },
	{ name: 'Al Jazeera', url: 'https://www.aljazeera.com/xml/rss/all.xml', language: 'en' },
	{ name: 'NPR World', url: 'https://feeds.npr.org/1004/rss.xml', language: 'en' },
	{ name: 'The Guardian World', url: 'https://www.theguardian.com/world/rss', language: 'en' },
]

const TOPICS = [
	{
		slug: 'israel-iran-conflict',
		titleZh: '以色列—伊朗區域衝突',
		titleEn: 'Israel–Iran regional conflict',
		domain: 'INTL',
		interval: 'ONGOING',
		regions: ['MIDEAST'],
		overallReliability: 'DISPUTED',
		eventCount: 4,
		sourceCount: 120,
		languageCount: 4,
	},
	{
		slug: 'us-china-tech-war',
		titleZh: '美中科技貿易戰',
		titleEn: 'U.S.–China tech trade war',
		domain: 'BIZ',
		interval: 'WEEK',
		regions: ['NORTH_AMERICA', 'EAST_ASIA'],
		overallReliability: 'DEVELOPING',
		eventCount: 8,
		sourceCount: 64,
		languageCount: 3,
	},
	{
		slug: 'wpac-typhoon-season',
		titleZh: '西太平洋颱風季',
		titleEn: 'W. Pacific typhoon season',
		domain: 'DISASTER',
		interval: 'WEEK',
		regions: ['SE_ASIA', 'EAST_ASIA'],
		overallReliability: 'VERIFIED',
		eventCount: 6,
		sourceCount: 41,
		languageCount: 2,
	},
	{
		slug: 'global-ai-regulation',
		titleZh: '全球 AI 監管動向',
		titleEn: 'Global AI regulation',
		domain: 'TECH',
		interval: 'ONGOING',
		regions: ['EUROPE', 'NORTH_AMERICA'],
		overallReliability: 'DEVELOPING',
		eventCount: 11,
		sourceCount: 88,
		languageCount: 5,
	},
]

const IRAN_TIMELINE = [
	{ occurredLabel: '6/16', descZh: '第三方斡旋下展開非正式接觸', descEn: 'Informal contact begins under third-party mediation', sourceLabel: '路透社 Reuters', sourceUrl: 'https://www.reuters.com', isConflicting: false },
	{ occurredLabel: '6/17', descZh: '美國國務院證實「有初步接觸」，未提協議', descEn: "State Dept. confirms 'preliminary contact,' no deal", sourceLabel: '美國國務院 U.S. State Dept.', sourceUrl: 'https://www.state.gov', isConflicting: false },
	{ occurredLabel: '6/18', descZh: '部分媒體報導「即將達成框架協議」；伊朗官方否認', descEn: "Some outlets report 'imminent framework deal'; Iran denies", sourceLabel: '半島電視台 / 伊朗外交部', sourceUrl: 'https://www.aljazeera.com', isConflicting: true },
	{ occurredLabel: '6/19', descZh: '社群流傳「已簽署」貼文，無一手佐證', descEn: "Social posts claim 'signed,' no corroboration", sourceLabel: '社群貼文 Social', sourceUrl: null, isConflicting: false },
]

const IRAN_SOURCES = [
	{ sourceName: '美國國務院聲明 U.S. State Dept.', externalUrl: 'https://www.state.gov', credibilityTier: 'OFFICIAL', isAuthoritative: true, reasoningZh: '一手聲明，可直接查證原文，與多家具名報導一致。', reasoningEn: 'First-hand statement, originally verifiable, consistent with named reporting.' },
	{ sourceName: '路透社 Reuters', externalUrl: 'https://www.reuters.com', credibilityTier: 'HIGH', isAuthoritative: false, reasoningZh: '具名記者、多方查證，內容與官方說法一致。', reasoningEn: 'Named reporters, cross-checked, consistent with the official account.' },
	{ sourceName: '半島電視台 Al Jazeera', externalUrl: 'https://www.aljazeera.com', credibilityTier: 'MEDIUM', isAuthoritative: false, reasoningZh: '引述未具名官員，部分內容先於官方證實。', reasoningEn: 'Cites unnamed officials; some claims ran ahead of official confirmation.' },
	{ sourceName: '某社群貼文 Social media post', externalUrl: null, credibilityTier: 'LOW', isAuthoritative: false, reasoningZh: '匿名、無佐證，且與官方說法矛盾。', reasoningEn: 'Anonymous, uncorroborated, and contradicts the official account.' },
]

async function main() {
	for (const s of SOURCES) {
		await prisma.source.upsert({
			where: { url: s.url },
			create: { name: s.name, url: s.url, language: s.language, type: 'RSS' },
			update: { name: s.name, language: s.language },
		})
	}

	const topicIdBySlug: Record<string, string> = {}
	for (const tp of TOPICS) {
		const topic = await prisma.topic.upsert({
			where: { slug: tp.slug },
			create: tp,
			update: tp,
		})
		topicIdBySlug[tp.slug] = topic.id
	}

	const iranTopicId = topicIdBySlug['israel-iran-conflict']
	const iranEvents = [
		{ slug: 'iran-us-nuclear-talks', titleZh: '伊朗與美國重啟核子談判', titleEn: 'Iran and U.S. resume nuclear talks', overallReliability: 'DISPUTED', importanceScore: 0.9, firstSeenAt: new Date('2026-06-19'), narrativeZh: '伊朗與美國近期傳出重啟核子談判。事件起於 6/16 第三方斡旋下的非正式接觸，隨後多家媒體出現「即將達成框架協議」的報導，但各方說法分歧。截至目前，美國國務院僅證實「有初步接觸」，伊朗官方否認已有任何協議，部分社群與匿名來源的「突破」說法尚無一手佐證。', narrativeEn: 'Iran and the U.S. are reported to have resumed nuclear talks. It began on 6/16 with informal, third-party-brokered contact; several outlets then reported an imminent framework deal, but accounts diverge. So far the U.S. State Department confirms only "preliminary contact," Iran officially denies any agreement, and "breakthrough" claims from social and anonymous sources lack first-hand corroboration.' },
		{ slug: 'iran-border-airstrikes', titleZh: '邊境空襲與互相指控', titleEn: 'Border airstrikes and mutual accusations', overallReliability: 'DEVELOPING', importanceScore: 0.7, firstSeenAt: new Date('2026-06-12'), narrativeZh: null, narrativeEn: null },
		{ slug: 'iran-unsc-emergency', titleZh: '聯合國安理會緊急磋商', titleEn: 'UN Security Council emergency consultations', overallReliability: 'VERIFIED', importanceScore: 0.6, firstSeenAt: new Date('2026-06-05'), narrativeZh: null, narrativeEn: null },
		{ slug: 'iran-conflict-escalation', titleZh: '衝突驟然升級', titleEn: 'Sudden escalation of the conflict', overallReliability: 'VERIFIED', importanceScore: 0.6, firstSeenAt: new Date('2026-05-28'), narrativeZh: null, narrativeEn: null },
	]

	for (const ev of iranEvents) {
		await prisma.event.upsert({
			where: { slug: ev.slug },
			create: { ...ev, topicId: iranTopicId, domain: 'INTL', regions: ['MIDEAST'], status: 'RESEARCHED' },
			update: { ...ev, topicId: iranTopicId, domain: 'INTL', regions: ['MIDEAST'], status: 'RESEARCHED' },
		})
	}

	const iranMain = await prisma.event.findUnique({ where: { slug: 'iran-us-nuclear-talks' } })
	if (iranMain) {
		await prisma.eventTimeline.deleteMany({ where: { eventId: iranMain.id } })
		await prisma.eventSource.deleteMany({ where: { eventId: iranMain.id } })
		await prisma.eventTimeline.createMany({
			data: IRAN_TIMELINE.map((n, i) => ({ eventId: iranMain.id, ...n, rank: i })),
		})
		await prisma.eventSource.createMany({
			data: IRAN_SOURCES.map((s, i) => ({ eventId: iranMain.id, ...s, rank: i + 1 })),
		})
	}

	// 其餘議題各放一個事件，讓議題頁非空
	const extraEvents = [
		{ topic: 'us-china-tech-war', slug: 'us-china-export-controls', titleZh: '新一輪晶片出口管制', titleEn: 'New round of chip export controls', regions: ['NORTH_AMERICA', 'EAST_ASIA'], domain: 'BIZ', overallReliability: 'DEVELOPING' },
		{ topic: 'wpac-typhoon-season', slug: 'typhoon-luzon-landfall', titleZh: '颱風於呂宋島登陸', titleEn: 'Typhoon makes landfall on Luzon', regions: ['SE_ASIA'], domain: 'DISASTER', overallReliability: 'VERIFIED' },
		{ topic: 'global-ai-regulation', slug: 'eu-ai-act-enforcement', titleZh: '歐盟 AI 法案進入執法階段', titleEn: 'EU AI Act enters enforcement phase', regions: ['EUROPE'], domain: 'TECH', overallReliability: 'DEVELOPING' },
	]
	for (const ev of extraEvents) {
		await prisma.event.upsert({
			where: { slug: ev.slug },
			create: { slug: ev.slug, titleZh: ev.titleZh, titleEn: ev.titleEn, regions: ev.regions, domain: ev.domain, overallReliability: ev.overallReliability, status: 'RESEARCHED', topicId: topicIdBySlug[ev.topic] },
			update: { topicId: topicIdBySlug[ev.topic] },
		})
	}

	console.log('seed done: sources', SOURCES.length, 'topics', TOPICS.length)
}

main()
	.then(() => process.exit(0))
	.catch((err) => {
		console.error(err)
		process.exit(1)
	})
