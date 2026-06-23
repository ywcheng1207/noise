export type BadgeVariant = 'success' | 'info' | 'warning' | 'muted'

/** Reliability enum 值 → badge 變體。 */
export const RELIABILITY_VARIANT: Record<string, BadgeVariant> = {
	VERIFIED: 'success',
	DEVELOPING: 'info',
	DISPUTED: 'warning',
	UNVERIFIED: 'muted',
}

/** CredibilityTier enum 值 → badge 變體。 */
export const TIER_VARIANT: Record<string, BadgeVariant> = {
	OFFICIAL: 'info',
	HIGH: 'success',
	MEDIUM: 'warning',
	LOW: 'muted',
	UNVERIFIED: 'muted',
}
