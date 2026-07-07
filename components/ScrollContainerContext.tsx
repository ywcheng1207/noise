'use client'

import { createContext, useContext, type RefObject } from 'react'

const ScrollContainerContext = createContext<RefObject<HTMLDivElement | null> | null>(null)

export const ScrollContainerProvider = ScrollContainerContext.Provider

// 分頁內容區(TabsContent)本身就是唯一會捲動的容器;深層子元件(如虛擬化清單)
// 需要這個 DOM node 當 react-virtual 的 scroll element,透過 context 取得,避免逐層傳 props。
export function useScrollContainerRef() {
	return useContext(ScrollContainerContext)
}
