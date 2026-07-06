'use client'

import { useEffect, useRef, useState } from 'react'

const PAGE_SIZE = 20

/**
 * 大量清單的漸進渲染:初始只渲染 PAGE_SIZE 筆,捲動到底部哨兵元素時才展開下一批。
 * 資料本身已在 SSR 一次拉齊(篩選需要看到全量),這裡只降低 DOM 渲染/hydration 成本。
 */
export function useIncrementalReveal<T>(items: T[]) {
	const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)
	const sentinelRef = useRef<HTMLDivElement>(null)

	useEffect(() => {
		setVisibleCount(PAGE_SIZE)
	}, [items])

	useEffect(() => {
		const sentinel = sentinelRef.current
		if (!sentinel) return

		const observer = new IntersectionObserver(
			(entries) => {
				if (entries[0].isIntersecting) {
					setVisibleCount((prev) => Math.min(prev + PAGE_SIZE, items.length))
				}
			},
			{ rootMargin: '400px' },
		)
		observer.observe(sentinel)
		return () => observer.disconnect()
	}, [items.length])

	return {
		visibleItems: items.slice(0, visibleCount),
		hasMore: visibleCount < items.length,
		sentinelRef,
	}
}
