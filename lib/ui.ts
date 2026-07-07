import {
	AlertTriangle,
	CheckCircle2,
	Clock,
	Cpu,
	Globe,
	HelpCircle,
	Landmark,
	type LucideIcon,
	MoreHorizontal,
	Shield,
	ShieldAlert,
	ShieldCheck,
	TrendingUp,
	Users,
} from 'lucide-react'

export type BadgeVariant = 'success' | 'info' | 'warning' | 'muted'

/** Reliability enum 值 → badge 變體。 */
export const RELIABILITY_VARIANT: Record<string, BadgeVariant> = {
	VERIFIED: 'success',
	DEVELOPING: 'info',
	DISPUTED: 'warning',
	UNVERIFIED: 'muted',
}

/** Reliability enum 值 → icon。 */
export const RELIABILITY_ICON: Record<string, LucideIcon> = {
	VERIFIED: CheckCircle2,
	DEVELOPING: Clock,
	DISPUTED: AlertTriangle,
	UNVERIFIED: HelpCircle,
}

/** CredibilityTier enum 值 → badge 變體。 */
export const TIER_VARIANT: Record<string, BadgeVariant> = {
	OFFICIAL: 'info',
	HIGH: 'success',
	MEDIUM: 'warning',
	LOW: 'muted',
	UNVERIFIED: 'muted',
}

/** CredibilityTier enum 值 → icon。 */
export const TIER_ICON: Record<string, LucideIcon> = {
	OFFICIAL: ShieldCheck,
	HIGH: ShieldCheck,
	MEDIUM: Shield,
	LOW: ShieldAlert,
	UNVERIFIED: HelpCircle,
}

/** Domain enum 值 → icon。 */
export const DOMAIN_ICON: Record<string, LucideIcon> = {
	INTL: Globe,
	POLITICS: Landmark,
	BIZ: TrendingUp,
	TECH: Cpu,
	DISASTER: AlertTriangle,
	SOCIETY: Users,
	OTHER: MoreHorizontal,
}
