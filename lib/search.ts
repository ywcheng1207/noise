/** 模糊比對:忽略大小寫與前後空白,關鍵字為空字串時視為全部符合。 */
export function matchesKeyword(keyword: string, ...fields: Array<string | null | undefined>) {
	const needle = keyword.trim().toLowerCase()
	if (!needle) return true
	return fields.some((field) => field?.toLowerCase().includes(needle) ?? false)
}
