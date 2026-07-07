'use client'

import { useRef, useState, type ReactNode } from 'react'
import { usePathname, useRouter } from 'next/navigation'

import { ScrollContainerProvider } from '@/components/ScrollContainerContext'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

type RootTab = 'intro' | 'topics'

export interface TabShellLabels {
	intro: string
	topics: string
	log: string
}

export function TabShell({
	lng,
	labels,
	breadcrumb,
	intro,
	children,
}: {
	lng: string
	labels: TabShellLabels
	breadcrumb: ReactNode
	intro: ReactNode
	children: ReactNode
}) {
	const pathname = usePathname()
	const router = useRouter()
	const scrollContainerRef = useRef<HTMLDivElement>(null)
	const overviewHref = `/${lng}`
	// 第一次掛載就已經在子頁面(議題/事件/日誌)代表使用者是從深連結進來的,
	// 之後透過麵包屑「回總覽」應該回到議題清單而不是介紹頁。
	const [rootTab, setRootTab] = useState<RootTab>(() => (pathname === overviewHref ? 'intro' : 'topics'))

	const isAtRoot = pathname === overviewHref
	const activeTab = pathname.startsWith(`${overviewHref}/log`)
		? 'log'
		: pathname.startsWith(`${overviewHref}/topic`) || pathname.startsWith(`${overviewHref}/event`)
			? 'topics'
			: rootTab

	function handleTabSelect(value: string) {
		if (value === 'log') {
			router.push(`${overviewHref}/log`)
			return
		}
		if (!isAtRoot) router.push(overviewHref)
		setRootTab(value === 'intro' ? 'intro' : 'topics')
	}

	const content = activeTab === 'intro' && isAtRoot ? intro : children

	return (
		<Tabs value={activeTab} onValueChange={handleTabSelect} className='flex h-full flex-col'>
			<TabsList>
				<TabsTrigger value='intro' onClick={() => handleTabSelect('intro')}>
					{labels.intro}
				</TabsTrigger>
				<TabsTrigger value='topics' onClick={() => handleTabSelect('topics')}>
					{labels.topics}
				</TabsTrigger>
				<TabsTrigger value='log' onClick={() => handleTabSelect('log')}>
					{labels.log}
				</TabsTrigger>
			</TabsList>
			<TabsContent
				key={activeTab}
				ref={scrollContainerRef}
				value={activeTab}
				className='min-h-0 flex-1 scrollbar-thin overflow-y-auto'
			>
				<ScrollContainerProvider value={scrollContainerRef}>
					<div className='flex flex-col gap-4'>
						{/* 麵包屑 parallel route 在跨路由樹導航時偶爾不會正確 fallback 回 default.tsx(Next.js 已知限制),
						    根路徑一律不該有麵包屑,直接用當下路徑主動擋掉,不依賴 slot 是否過期。 */}
						{isAtRoot ? null : breadcrumb}
						{content}
					</div>
				</ScrollContainerProvider>
			</TabsContent>
		</Tabs>
	)
}
