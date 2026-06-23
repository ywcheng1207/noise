/**
 * 統一的 API 回傳格式泛型。
 * 所有後端 API Route 的 response body 都應符合此格式，
 * 且所有前台 apiFetch 接到的資料也會被轉化為此格式。
 */
export interface ApiResponse<T = unknown> {
	success: boolean
	data?: T
	message?: string
	error?: string
}

export interface PaginatedData<T> {
	items: T[]
	total: number
	page: number
	pageSize: number
	totalPages: number
}

export type PaginatedApiResponse<T> = ApiResponse<PaginatedData<T>>
