import { createInstance } from 'i18next'
import resourcesToBackend from 'i18next-resources-to-backend'
import { getOptions, defaultNS } from './settings'

async function initI18next(lng: string, ns: string) {
	const instance = createInstance()
	await instance
		.use(
			resourcesToBackend(
				(language: string, namespace: string) => import(`./locales/${language}/${namespace}.json`),
			),
		)
		.init(getOptions(lng, ns))
	return instance
}

/** Server-side translation helper（RSC 用）。 */
export async function getT(lng: string, ns: string = defaultNS) {
	const instance = await initI18next(lng, ns)
	return { t: instance.getFixedT(lng, ns), i18n: instance }
}
