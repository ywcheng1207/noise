import type { Metadata } from 'next'
import { headers } from 'next/headers'
import type { ReactNode } from 'react'
import { ThemeProvider } from 'next-themes'
import { QueryProvider } from '@/providers/QueryProvider'
import StoreProvider from '@/store/provider'
import { cn } from '@/lib/utils'
import './globals.css'

export const metadata: Metadata = {
	title: { default: '噪音 — 新聞事件過濾與可信度', template: '%s | 噪音' },
	description: '以核心議題與事件為單位，幫讀者篩選與查證新聞：時序、摘要與來源可信度排名。',
}

const RootLayout = async ({ children }: { children: ReactNode }) => {
	const headerList = await headers()
	const pathname = headerList.get('x-pathname') || ''
	const lng = pathname.split('/')[1] || 'zh-Hant'

	return (
		<html lang={lng} suppressHydrationWarning>
			<body suppressHydrationWarning className={cn('bg-background text-foreground min-h-screen antialiased')}>
				<StoreProvider>
					<QueryProvider>
						<ThemeProvider attribute='class' defaultTheme='light' disableTransitionOnChange>
							{children}
						</ThemeProvider>
					</QueryProvider>
				</StoreProvider>
			</body>
		</html>
	)
}

export default RootLayout
