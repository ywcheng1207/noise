import type { NextConfig } from 'next'

const securityHeaders = [
	{ key: 'X-Frame-Options', value: 'SAMEORIGIN' },
	{ key: 'X-Content-Type-Options', value: 'nosniff' },
	{ key: 'Referrer-Policy', value: 'origin-when-cross-origin' },
	{ key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
	{
		key: 'Content-Security-Policy',
		value: [
			"default-src 'self'",
			"script-src 'self' 'unsafe-inline' 'unsafe-eval'",
			"style-src 'self' 'unsafe-inline'",
			"img-src 'self' blob: data: https:",
			"connect-src 'self' https:",
			"font-src 'self'",
			"frame-ancestors 'none'",
		].join('; '),
	},
]

const nextConfig: NextConfig = {
	eslint: { ignoreDuringBuilds: true },
	typescript: { ignoreBuildErrors: true },
	async headers() {
		return [{ source: '/(.*)', headers: securityHeaders }]
	},
}

export default nextConfig
