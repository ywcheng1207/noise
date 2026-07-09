import { NextRequest, NextResponse } from 'next/server'
import { fallbackLng, languages, cookieName } from '@/i18n/settings'

// `.*\..*`(路徑含副檔名)排除所有靜態檔案——public/ 底下的資源(如 /intro/*.png)
// 沒有語系前綴，少了這條會被誤判成缺語系的頁面路徑而 307 轉址，導致圖片打不開。
export const config = {
	matcher: ['/((?!api|_next/static|_next/image|assets|favicon.ico|icon.png|.*\\..*).*)'],
}

/**
 * 解析 Accept-Language,只比對主要語言子標籤(如 zh-TW → zh)。
 * `accept-language` 套件對 zh-Hant 這種 script 子標籤比對過嚴,連最常見的
 * 瀏覽器格式(zh-TW,zh;q=0.9,en-US;q=0.8,en;q=0.7)都會誤判成 en,故自行實作。
 */
function detectLanguage(headerValue: string | null): string {
	if (!headerValue) return fallbackLng

	const ranked = headerValue
		.split(',')
		.map((part) => {
			const [tag, qPart] = part.trim().split(';q=')
			const primary = tag.split('-')[0].toLowerCase()
			const q = qPart ? Number(qPart) : 1
			return { primary, q: Number.isFinite(q) ? q : 1 }
		})
		.sort((a, b) => b.q - a.q)

	for (const { primary } of ranked) {
		if (primary === 'zh') return fallbackLng
		if (languages.includes(primary)) return primary
	}
	return fallbackLng
}

export function middleware(req: NextRequest) {
	const { pathname } = req.nextUrl
	const firstSegment = pathname.split('/')[1]
	const hasLng = languages.includes(firstSegment)

	if (!hasLng && !pathname.startsWith('/_next')) {
		const cookieValue = req.cookies.get(cookieName)?.value
		const lng =
			(cookieValue && languages.includes(cookieValue) ? cookieValue : null) ??
			detectLanguage(req.headers.get('Accept-Language'))
		return NextResponse.redirect(new URL(`/${lng}${pathname}`, req.url))
	}

	const response = NextResponse.next()
	response.headers.set('x-pathname', pathname)
	if (hasLng) response.cookies.set(cookieName, firstSegment)
	return response
}
