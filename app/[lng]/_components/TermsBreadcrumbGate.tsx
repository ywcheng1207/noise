'use client'

import type { ReactNode } from 'react'
import { usePathname } from 'next/navigation'

// 麵包屑 parallel route 從 /terms 導到其他路徑時,偶爾不會正確 fallback 回 default.tsx
// (Next.js 已知限制),導致舊的「服務條款」麵包屑殘留。用目前路徑主動判斷是否真的在
// /terms,不信任 slot 本身是否已經過期。
export function TermsBreadcrumbGate({ lng, children }: { lng: string; children: ReactNode }) {
	const pathname = usePathname()
	return pathname === `/${lng}/terms` ? children : null
}
