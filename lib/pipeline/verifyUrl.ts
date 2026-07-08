import type { GroundingSource } from '@/lib/gemini'

const CHECK_TIMEOUT_MS = 5000
const USER_AGENT = 'Mozilla/5.0 (compatible; NoiseBot/1.0)'

function safeHostname(url: string): string | null {
	try {
		return new URL(url).hostname
	} catch {
		return null
	}
}

// Node fetch(undici) 把底層的 DNS/連線錯誤包在 error.cause 裡，頂層 message 只會是
// 籠統的「fetch failed」——要判斷 ENOTFOUND/ECONNREFUSED 得往 cause 裡挖，不能只看頂層訊息。
function isDnsOrConnectionFailure(err: unknown): boolean {
	if (!(err instanceof Error)) return false
	const cause = err.cause
	const causeCode = cause && typeof cause === 'object' && 'code' in cause ? String(cause.code) : ''
	const combined = `${err.message} ${causeCode} ${cause instanceof Error ? cause.message : ''}`
	return /ENOTFOUND|ECONNREFUSED/i.test(combined)
}

// 只有明確訊號(404/410/5xx，或 DNS/連線失敗)才判定死連結；403/429 這類「被擋」
// 無法證明頁面真的不存在(常是 bot 擋在前面，真人瀏覽器打得開)，保守不判死以免誤刪還活著的連結。
async function isConfirmedDead(url: string): Promise<boolean> {
	try {
		const res = await fetch(url, {
			method: 'HEAD',
			redirect: 'follow',
			signal: AbortSignal.timeout(CHECK_TIMEOUT_MS),
			headers: { 'User-Agent': USER_AGENT },
		})
		return res.status === 404 || res.status === 410 || res.status >= 500
	} catch (err) {
		return isDnsOrConnectionFailure(err)
	}
}

// grounding 回傳的 uri 是 vertexaisearch 轉址連結（會過期），真正的來源網域放在 title。
// 追蹤轉址取得最終文章網址後才儲存，避免存進一個日後會過期的轉址連結。
async function resolveFinalUrl(redirectUrl: string): Promise<string | null> {
	try {
		const res = await fetch(redirectUrl, {
			redirect: 'follow',
			signal: AbortSignal.timeout(CHECK_TIMEOUT_MS),
			headers: { 'User-Agent': USER_AGENT },
		})
		await res.body?.cancel()
		if (res.status === 404 || res.status === 410 || res.status >= 500) return null
		return res.url || null
	} catch {
		return null
	}
}

/**
 * 驗證 Gemini 在 JSON 裡手打的來源網址。確認死掉的話，優先換成同網域、真正來自
 * Google Search 接地的網址（groundingChunks，程式化取得，保證是真實搜尋結果）；
 * 都不行就回 null，不留一個已知打不開的連結給使用者點。
 */
export async function resolveVerifiedUrl(
	candidateUrl: string | null | undefined,
	groundedSources: GroundingSource[],
): Promise<string | null> {
	if (!candidateUrl) return null
	if (!(await isConfirmedDead(candidateUrl))) return candidateUrl

	const candidateHost = safeHostname(candidateUrl)
	if (!candidateHost) return null

	const sameDomain = groundedSources.filter(
		(g) => g.title === candidateHost || safeHostname(g.uri) === candidateHost,
	)
	for (const source of sameDomain) {
		const finalUrl = await resolveFinalUrl(source.uri)
		if (finalUrl) return finalUrl
	}

	return null
}
