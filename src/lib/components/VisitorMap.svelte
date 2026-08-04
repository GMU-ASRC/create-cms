<script lang="ts">
	import 'svelte-maplibre-gl/vite';
	import 'maplibre-gl/dist/maplibre-gl.css';
	import { FillLayer, LineLayer, MapLibre, GeoJSONSource, Popup } from 'svelte-maplibre-gl';
	import type * as maplibregl from 'maplibre-gl';
	import type { NamedCount } from '$lib/server/analytics';

	let { countries }: { countries: NamedCount[] } = $props();

	let hoveredFeature: maplibregl.MapGeoJSONFeature | undefined = $state.raw();

	const countByCode = $derived(new Map(countries.map((entry) => [entry.name, entry.count])));
	const maxCount = $derived(countries.reduce((max, entry) => Math.max(max, entry.count), 0));

	const fillColor: unknown = $derived(
		countries.length === 0
			? '#cbd5e1'
			: [
					'match',
					['get', 'iso_a2'],
					...countries.flatMap((entry) => [entry.name, '#006633']),
					'#cbd5e1'
				]
	);

	const fillOpacity: unknown = $derived(
		countries.length === 0
			? 0.05
			: [
					'match',
					['get', 'iso_a2'],
					...countries.flatMap((entry) => [
						entry.name,
						maxCount > 0 ? 0.15 + 0.75 * (entry.count / maxCount) : 0.15
					]),
					0.05
				]
	);

	const hoveredCode = $derived(hoveredFeature?.properties?.iso_a2 as string | undefined);
	const hoveredCount = $derived(hoveredCode ? countByCode.get(hoveredCode) : undefined);

	function formatVisitors(count: number | undefined): string {
		return count ? `${count.toLocaleString()} visitors` : 'No visitors';
	}
</script>

<MapLibre
	class="h-80 w-full overflow-hidden rounded-lg"
	style="https://basemaps.cartocdn.com/gl/positron-gl-style/style.json"
	zoom={0.4}
	center={{ lng: 10, lat: 15 }}
>
	<GeoJSONSource data="/data/world-countries.geojson" promoteId="iso_a2">
		<FillLayer
			paint={{
				'fill-color': fillColor,
				'fill-opacity': fillOpacity
			} as any}
			onmousemove={(ev) => {
				hoveredFeature = ev.features?.[0];
			}}
			onmouseleave={() => (hoveredFeature = undefined)}
		/>
		<LineLayer paint={{ 'line-color': '#94a3b8', 'line-width': 0.5 }} />
		{#if hoveredFeature}
			<Popup trackPointer closeButton={false}>
				<div class="text-xs">
					<p class="font-semibold text-slate-800">{hoveredFeature.properties?.name}</p>
					<p class="text-slate-500">{formatVisitors(hoveredCount)}</p>
				</div>
			</Popup>
		{/if}
	</GeoJSONSource>
</MapLibre>
