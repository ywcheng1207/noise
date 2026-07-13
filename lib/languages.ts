const LANGUAGE_LABELS: Record<string, { zh: string; en: string }> = {
	en: { zh: '英文', en: 'English' },
	zh: { zh: '中文', en: 'Chinese' },
	'zh-hant': { zh: '繁體中文', en: 'Chinese (Traditional)' },
	'zh-hans': { zh: '簡體中文', en: 'Chinese (Simplified)' },
	ar: { zh: '阿拉伯文', en: 'Arabic' },
	fr: { zh: '法文', en: 'French' },
	ja: { zh: '日文', en: 'Japanese' },
	ko: { zh: '韓文', en: 'Korean' },
	de: { zh: '德文', en: 'German' },
	es: { zh: '西班牙文', en: 'Spanish' },
	ru: { zh: '俄文', en: 'Russian' },
	pt: { zh: '葡萄牙文', en: 'Portuguese' },
	it: { zh: '義大利文', en: 'Italian' },
	hi: { zh: '印地文', en: 'Hindi' },
}

/** 語言代碼（不論是 Source 用的 en/zh-Hant/zh-Hans，或研究階段用的 ISO 639-1 兩碼）轉可讀標籤；查不到就退回原始代碼大寫顯示。 */
export function languageLabel(code: string | null | undefined, lng: string): string | null {
	if (!code) return null
	const entry = LANGUAGE_LABELS[code.toLowerCase()]
	if (!entry) return code.toUpperCase()
	return lng.startsWith('zh') ? entry.zh : entry.en
}
