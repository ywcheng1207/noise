'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

const PAGE_SIZE = 20

/**
 * 大量清單的漸進渲染:初始只渲染 PAGE_SIZE 筆,捲動到底部哨兵元素時才展開下一批。
 * 資料本身已在 SSR 一次拉齊(篩選需要看到全量),這裡只降低 DOM 渲染/hydration 成本。
 * sentinel 用 callback ref(而非 useRef + 依賴陣列 effect):
 * 確保 observer 的建立/銷毀永遠跟哨兵 DOM node 的掛載/卸載同步,不會有「新哨兵掛載了但沒人 observe」的空窗。
 */
export function useIncrementalReveal<T>(items: T[]) {
	const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)
	const observerRef = useRef<IntersectionObserver | null>(null)

	useEffect(() => {
		setVisibleCount(PAGE_SIZE)
	}, [items])

	const sentinelRef = useCallback((node: HTMLDivElement | null) => {
		observerRef.current?.disconnect()
		observerRef.current = null
		if (!node) return

		observerRef.current = new IntersectionObserver(
			(entries) => {
				if (entries[0].isIntersecting) setVisibleCount((prev) => prev + PAGE_SIZE)
			},
			{ rootMargin: '400px' },
		)
		observerRef.current.observe(node)
	}, [])

	return {
		visibleItems: items.slice(0, visibleCount),
		hasMore: visibleCount < items.length,
		sentinelRef,
	}
}
