export const fallbackLng = 'zh-Hant'
export const languages = [fallbackLng, 'en']
export const cookieName = 'i18next'
export const defaultNS = 'common'

export function getOptions(lng = fallbackLng, ns = defaultNS) {
	return {
		supportedLngs: languages,
		fallbackLng,
		lng,
		fallbackNS: defaultNS,
		defaultNS,
		ns,
	}
}
