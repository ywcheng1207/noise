import { REGIONS, type RegionKey } from '@/lib/regions'

export const DOMAINS = ['INTL', 'POLITICS', 'BIZ', 'TECH', 'DISASTER', 'SOCIETY', 'OTHER'] as const
export const RELIABILITIES = ['VERIFIED', 'DEVELOPING', 'DISPUTED', 'UNVERIFIED'] as const
export const TIERS = ['OFFICIAL', 'HIGH', 'MEDIUM', 'LOW', 'UNVERIFIED'] as const
export const INTERVALS = ['TODAY', 'WEEK', 'MONTH', 'ONGOING'] as const

export function normalizeDomain(value: string) {
	return DOMAINS.some((d) => d === value) ? value : 'OTHER'
}

export function normalizeReliability(value: string) {
	return RELIABILITIES.some((r) => r === value) ? value : 'DEVELOPING'
}

export function normalizeTier(value: string) {
	return TIERS.some((t) => t === value) ? value : 'UNVERIFIED'
}

export function normalizeRegions(values: string[]): RegionKey[] {
	return values.filter((v): v is RegionKey => REGIONS.some((r) => r === v))
}
