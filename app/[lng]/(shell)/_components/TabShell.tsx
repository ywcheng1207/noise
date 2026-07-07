'use client'

import { useState, type ReactNode } from 'react'
import { usePathname, useRouter } from 'next/navigation'

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
		<Tabs value={activeTab} onValueChange={handleTabSelect} className='flex flex-col'>
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
			<TabsContent key={activeTab} value={activeTab} className='flex flex-col gap-4'>
				{breadcrumb}
				{content}
			</TabsContent>
		</Tabs>
	)
}
