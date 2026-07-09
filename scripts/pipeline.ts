/**
 * 本地手動觸發管線：依序打 ingest → cluster → research → consolidate → editorial 幾個端點。
 * 需先 `pnpm dev` 啟動伺服器，且伺服器端有 GEMINI_API_KEY。
 * 用法：pnpm pipeline
 */
const BASE = process.env.BASE_URL ?? 'http://localhost:3100'

async function hit(path: string) {
	const res = await fetch(`${BASE}${path}`)
	const json = await res.json().catch(() => ({}))
	console.log(path, res.status, JSON.stringify(json))
}

async function main() {
	await hit('/api/cron/ingest')
	await hit('/api/cron/cluster')
	await hit('/api/cron/research')
	await hit('/api/cron/consolidate')
	await hit('/api/cron/editorial')
	console.log('pipeline done')
}

main().catch((err) => {
	console.error(err)
	process.exit(1)
})
