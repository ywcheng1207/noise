'use client'

import { geoNaturalEarth1, geoPath } from 'd3-geo'
import { feature } from 'topojson-client'
import worldData from 'world-atlas/countries-110m.json'
import { COUNTRY_NUMERIC_TO_REGION, type RegionKey } from '@/lib/regions'

const WIDTH = 640
const HEIGHT = 280

interface CountryPath {
	id: string
	d: string
	region: RegionKey | undefined
}

// 投影只依常數，與資料無關：算一次後共用，避免每個 list item 各算一遍整張世界地圖。
let cachedPaths: CountryPath[] | null = null

function getWorldPaths(): CountryPath[] {
	if (cachedPaths) return cachedPaths
	const collection = feature(worldData, worldData.objects.countries)
	const features = 'features' in collection ? collection.features : []
	const projection = geoNaturalEarth1().fitSize([WIDTH, HEIGHT], collection)
	const path = geoPath(projection)
	const computed: CountryPath[] = features.map((f) => {
		const numericId = String(Number(f.id))
		return {
			id: numericId,
			d: path(f) ?? '',
			region: COUNTRY_NUMERIC_TO_REGION[numericId],
		}
	})
	cachedPaths = computed
	return computed
}

export function WorldMap({ activeRegions }: { activeRegions: RegionKey[] }) {
	const paths = getWorldPaths()
	const active = new Set(activeRegions)
	const hasActive = activeRegions.length > 0

	return (
		<svg
			viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
			className='h-auto w-full'
			role='img'
			aria-label='world map highlighting topic regions'
		>
			{paths.map((p) => {
				const on = p.region && active.has(p.region)
				return (
					<path
						key={p.id}
						d={p.d}
						strokeWidth={0.3}
						className={cnPath(Boolean(on), hasActive)}
					/>
				)
			})}
		</svg>
	)
}

function cnPath(on: boolean, hasActive: boolean) {
	if (on) return 'fill-warning stroke-background transition-colors'
	return hasActive
		? 'fill-muted/60 stroke-background transition-colors'
		: 'fill-muted stroke-background transition-colors'
}
