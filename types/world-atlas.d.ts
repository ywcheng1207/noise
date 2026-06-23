declare module 'world-atlas/countries-110m.json' {
	interface WorldTopology {
		type: 'Topology'
		objects: {
			countries: { type: string; geometries: unknown[] }
			land?: { type: string; geometries: unknown[] }
		}
		arcs: number[][][]
		transform?: { scale: [number, number]; translate: [number, number] }
		bbox?: number[]
	}
	const topology: WorldTopology
	export default topology
}
