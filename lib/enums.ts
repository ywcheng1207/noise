import { REGIONS, type RegionKey } from '@/lib/regions'

export const DOMAINS = ['INTL', 'POLITICS', 'BIZ', 'TECH', 'DISASTER', 'SOCIETY', 'OTHER'] as const
export const RELIABILITIES = ['VERIFIED', 'DEVELOPING', 'DISPUTED', 'UNVERIFIED'] as const
export const TIERS = ['OFFICIAL', 'HIGH', 'MEDIUM', 'LOW', 'UNVERIFIED'] as const
export const INTERVALS = ['TODAY', 'WEEK', 'MONTH', 'ONGOING'] as const
export const MEDIA_TYPES = ['VIDEO', 'TEXT'] as const

export const FOCUS_DOMAINS = ['POLITICS', 'BIZ', 'INTL', 'TECH'] as const

export function normalizeDomain(value: string): (typeof DOMAINS)[number] {
	return DOMAINS.find((d) => d === value) ?? 'OTHER'
}

export function isFocusDomain(value: string) {
	return FOCUS_DOMAINS.some((d) => d === value)
}

export function normalizeMediaType(value: string | null | undefined): (typeof MEDIA_TYPES)[number] {
	return MEDIA_TYPES.find((m) => m === value) ?? 'TEXT'
}

export function normalizeReliability(value: string): (typeof RELIABILITIES)[number] {
	return RELIABILITIES.find((r) => r === value) ?? 'DEVELOPING'
}

export function normalizeTier(value: string): (typeof TIERS)[number] {
	return TIERS.find((t) => t === value) ?? 'UNVERIFIED'
}

export function normalizeRegions(values: string[]): RegionKey[] {
	return values.filter((v): v is RegionKey => REGIONS.some((r) => r === v))
}
