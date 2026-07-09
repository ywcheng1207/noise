/** 脈絡治理的可調參數，集中定義方便日後依實際數據調整（比照 lib/gemini.ts 的 MODEL/PRICING 寫法）。 */
export const THREAD_CONFIG = {
	/** OPEN 事件超過此時數沒有新續報就轉 CLOSED。 */
	FOLLOW_UP_WINDOW_HOURS: 72,
	/** 累積續報數達此門檻，觸發一次輕量研究 + 可信度升級檢查。 */
	REFRESH_THRESHOLD: 3,
	/** 脈絡最後活動時間超過此天數轉 DORMANT。 */
	TOPIC_DORMANT_DAYS: 14,
	/** 脈絡最後活動時間超過此天數轉 ARCHIVED（與 DORMANT 門檻皆以 lastActivityAt 為基準，非疊加）。 */
	TOPIC_ARCHIVE_DAYS: 60,
	/** 同時處於 ACTIVE 的脈絡數量上限，由程式邏輯（非 AI）硬性把關。 */
	ACTIVE_THREAD_CAP: 12,
	/** 每日（UTC）AI 成本熔斷金額（USD）。 */
	DAILY_BUDGET_USD: 3,
} as const
