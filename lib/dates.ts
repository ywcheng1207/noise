import { format } from 'date-fns'
import { enUS } from 'date-fns/locale/en-US'
import { zhTW } from 'date-fns/locale/zh-TW'

export type OccurredPrecision = 'DAY' | 'MONTH' | 'YEAR'

const PRECISION_PATTERNS: Record<OccurredPrecision, { zh: string; en: string }> = {
	DAY: { zh: 'yyyy年M月d日', en: 'MMM d, yyyy' },
	MONTH: { zh: 'yyyy年M月', en: 'MMM yyyy' },
	YEAR: { zh: 'yyyy年', en: 'yyyy' },
}

function normalizePrecision(value: string | null | undefined): OccurredPrecision {
	if (value === 'MONTH' || value === 'YEAR') return value
	return 'DAY'
}

// DB 的日期以 UTC 錨定(管線寫入 Date.UTC),先取回 UTC 年月日再交給 date-fns,
// 避免 Vercel(UTC)與本地(+8)渲染出不同日期。
function toUtcCalendarDate(value: Date) {
	return new Date(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate())
}

/** 解析管線回傳的 ISO 日期字串(YYYY / YYYY-MM / YYYY-MM-DD)→ UTC 錨定日期 + 精度。 */
export function parseOccurredDate(value: string | null | undefined): {
	occurredAt: Date | null
	occurredPrecision: OccurredPrecision | null
} {
	const matched = value?.trim().match(/^(\d{4})(?:-(\d{1,2}))?(?:-(\d{1,2}))?$/)
	if (!matched) return { occurredAt: null, occurredPrecision: null }
	const [, year, month, day] = matched
	const occurredAt = new Date(Date.UTC(Number(year), month ? Number(month) - 1 : 0, day ? Number(day) : 1))
	if (Number.isNaN(occurredAt.getTime())) return { occurredAt: null, occurredPrecision: null }
	const occurredPrecision: OccurredPrecision = day ? 'DAY' : month ? 'MONTH' : 'YEAR'
	return { occurredAt, occurredPrecision }
}

/** 依語系與精度格式化時間軸日期;無結構化日期時退回原始標籤。 */
export function formatOccurred({
	lng,
	occurredAt,
	precision,
	fallbackLabel = null,
}: {
	lng: string
	occurredAt: Date | null
	precision?: string | null
	fallbackLabel?: string | null
}) {
	if (!occurredAt) return fallbackLabel
	const isZh = lng.startsWith('zh')
	const pattern = PRECISION_PATTERNS[normalizePrecision(precision)]
	return format(toUtcCalendarDate(occurredAt), isZh ? pattern.zh : pattern.en, {
		locale: isZh ? zhTW : enUS,
	})
}

/** 依語系格式化日期區間;同一天只顯示單日。 */
export function formatDateRange({ lng, start, end }: { lng: string; start: Date | null; end: Date | null }) {
	const from = start ? formatOccurred({ lng, occurredAt: start }) : null
	const to = end ? formatOccurred({ lng, occurredAt: end }) : null
	if (!from) return to
	if (!to || from === to) return from
	return `${from} – ${to}`
}

/** 完整日期＋時間(日誌等場景用),非 UTC 錨定,直接反映時間戳原始時刻。 */
export function formatDateTime({ lng, date }: { lng: string; date: Date | null }) {
	if (!date) return null
	const isZh = lng.startsWith('zh')
	return format(date, isZh ? 'yyyy年M月d日 HH:mm' : 'MMM d, yyyy HH:mm', { locale: isZh ? zhTW : enUS })
}

/** 只顯示時分(HH:mm),用於已知同一天、只需標示當天內先後順序的場景(如日誌單日頁的項目列表)。 */
export function formatTime({ date }: { date: Date | null }) {
	if (!date) return null
	return format(date, 'HH:mm')
}
