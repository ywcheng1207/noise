import type { ApiResponse } from '@/types/api'

interface ApiFetchOptions {
	method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
	data?: unknown
	signal?: AbortSignal
}

/**
 * 前台統一 fetch 入口（Hard Rule：禁止直接用 fetch）。
 * 會把回傳收斂為 ApiResponse<T> 並解開 data。
 */
export async function apiFetch<T = unknown>(
	endpoint: string,
	options: ApiFetchOptions = {},
): Promise<T> {
	const { method = 'GET', data, signal } = options
	const headers: Record<string, string> = { 'Content-Type': 'application/json' }
	const body = method !== 'GET' && typeof data !== 'undefined' ? JSON.stringify(data) : undefined

	const res = await fetch(`/api${endpoint}`, { method, headers, body, signal })

	const json: ApiResponse<T> = await res.json().catch(() => ({ success: false }))

	if (!res.ok || !json.success) {
		throw new Error(json.error || json.message || `API call failed (${res.status})`)
	}
	if (json.data === undefined) {
		throw new Error('API response missing data')
	}
	return json.data
}
