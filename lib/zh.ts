import * as OpenCC from 'opencc-js'

// 簡體→正體(臺灣用語)。已是正體或非中文的字串轉換後不變,可安全套用於所有 zh 欄位。
const convert = OpenCC.Converter({ from: 'cn', to: 'twp' })

/** AI 產出的中文欄位寫入 DB 前一律過這層,確保正體中文。 */
export function toTraditionalZh(text: string) {
	return convert(text)
}

export function toTraditionalZhOrNull(text: string | null | undefined) {
	return text ? convert(text) : null
}
