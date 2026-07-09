'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'
import { usePathname, useRouter } from 'next/navigation'

import { ScrollContainerProvider } from '@/components/ScrollContainerContext'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

type RootTab = 'intro' | 'topics'

const ROOT_TAB_STORAGE_KEY = 'noise-root-tab'

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

	// 用路徑本身的第二段判斷分頁,不依賴 lng prop 組字串比對——切換語系時
	// usePathname() 會比 server 傳下來的新 lng prop 更早更新,用 `${lng}/topic` 這種
	// 字串比對會有一瞬間對不上(pathname 已經是新語系、lng prop 還是舊的),
	// 誤判成不在子頁面而掉回本地 rootTab 狀態,導致切語言時畫面跳回介紹分頁。
	const secondSegment = pathname.split('/')[2]
	const isAtRoot = !secondSegment
	// 第一次掛載就已經在子頁面(議題/事件/日誌)代表使用者是從深連結進來的,
	// 之後透過麵包屑「回總覽」應該回到議題清單而不是介紹頁。
	const [rootTab, setRootTab] = useState<RootTab>(() => (isAtRoot ? 'intro' : 'topics'))

	// [lng] 是 generateStaticParams 的靜態動態區段,切換語系會整棵樹重新掛載、
	// rootTab 這種純前端 state 一定會遺失且無法從網址復原(根路徑在兩個語系下長得一樣)。
	// 用 sessionStorage 記住使用者最後選的分頁,掛載後(僅限根路徑)校正回來。
	useEffect(() => {
		if (!isAtRoot) return
		if (window.sessionStorage.getItem(ROOT_TAB_STORAGE_KEY) === 'topics') setRootTab('topics')
	}, [isAtRoot])

	const activeTab =
		secondSegment === 'log'
			? 'log'
			: secondSegment === 'topic' || secondSegment === 'event' || secondSegment === 'candidates'
				? 'topics'
				: rootTab

	function handleTabSelect(value: string) {
		if (value === 'log') {
			router.push(`${overviewHref}/log`)
			return
		}
		if (!isAtRoot) router.push(overviewHref)
		const next: RootTab = value === 'intro' ? 'intro' : 'topics'
		setRootTab(next)
		window.sessionStorage.setItem(ROOT_TAB_STORAGE_KEY, next)
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
						{isAtRoot ? null : (
							<div className='bg-card sticky top-0 z-10 -mx-4 -mt-4 px-4 pt-4 pb-2 sm:-mx-6 sm:-mt-6 sm:px-6 sm:pt-6'>
								{breadcrumb}
							</div>
						)}
						{content}
					</div>
				</ScrollContainerProvider>
			</TabsContent>
		</Tabs>
	)
}
