'use client'

import { useEffect, useState } from 'react'

const MOBILE_QUERY = '(max-width: 639px)'

/** 對應 Tailwind 的 sm 斷點(640px)。SSR 階段一律回傳 false,避免 hydration mismatch。 */
export function useIsMobile() {
	const [isMobile, setIsMobile] = useState(false)

	useEffect(() => {
		const mediaQuery = window.matchMedia(MOBILE_QUERY)
		function handleChange() {
			setIsMobile(mediaQuery.matches)
		}
		handleChange()
		mediaQuery.addEventListener('change', handleChange)
		return () => mediaQuery.removeEventListener('change', handleChange)
	}, [])

	return isMobile
}
