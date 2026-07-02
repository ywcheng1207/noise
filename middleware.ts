import { NextRequest, NextResponse } from 'next/server'
import acceptLanguage from 'accept-language'
import { fallbackLng, languages, cookieName } from '@/i18n/settings'

acceptLanguage.languages(languages)

export const config = {
	matcher: ['/((?!api|_next/static|_next/image|assets|favicon.ico|icon.png).*)'],
}

export function middleware(req: NextRequest) {
	let lng: string | null = null
	const cookieValue = req.cookies.get(cookieName)?.value
	if (cookieValue) lng = acceptLanguage.get(cookieValue)
	if (!lng) lng = acceptLanguage.get(req.headers.get('Accept-Language'))
	if (!lng) lng = fallbackLng

	const { pathname } = req.nextUrl
	const firstSegment = pathname.split('/')[1]
	const hasLng = languages.includes(firstSegment)

	if (!hasLng && !pathname.startsWith('/_next')) {
		return NextResponse.redirect(new URL(`/${lng}${pathname}`, req.url))
	}

	const response = NextResponse.next()
	response.headers.set('x-pathname', pathname)
	if (hasLng) response.cookies.set(cookieName, firstSegment)
	return response
}
