import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs))
}

export function slugify(input: string) {
	return input
		.toLowerCase()
		.trim()
		.replace(/[^a-z0-9一-鿿]+/g, '-')
		.replace(/^-+|-+$/g, '')
		.slice(0, 80)
}

export function canonicalizeUrl(raw: string) {
	try {
		const url = new URL(raw)
		const stripParams = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'fbclid', 'gclid']
		stripParams.forEach((p) => url.searchParams.delete(p))
		url.hash = ''
		const path = url.pathname.replace(/\/+$/, '') || '/'
		return `${url.protocol}//${url.host.toLowerCase()}${path}${url.search}`
	} catch {
		return raw.trim()
	}
}
