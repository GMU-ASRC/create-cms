<script lang="ts">
	import Icon from '@iconify/svelte';
	import Chart from 'chart.js/auto';
	import { browser } from '$app/environment';
	import type { NamedCount } from '$lib/server/analytics';
	import type { Component } from 'svelte';

	let VisitorMap: Component<{ countries: NamedCount[] }> | undefined = $state();

	if (browser) {
		import('$lib/components/VisitorMap.svelte').then((module) => {
			VisitorMap = module.default;
		});
	}

	let { data } = $props();

	const rangeOptions = [
		{ label: '24 hours', value: '24h' },
		{ label: '7 days', value: '7d' },
		{ label: '30 days', value: '30d' }
	];

	function toDateInputValue(date: Date): string {
		return date.toISOString().slice(0, 10);
	}

	const defaultCustomEnd = toDateInputValue(new Date());
	const defaultCustomStart = toDateInputValue(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000));

	let canvas: HTMLCanvasElement | undefined = $state();
	let chart: Chart | null = null;

	function formatNumber(value: number): string {
		return value.toLocaleString();
	}

	function formatDuration(totalSeconds: number, visits: number): string {
		if (visits <= 0) return '0s';
		const avgSeconds = Math.round(totalSeconds / visits);
		const minutes = Math.floor(avgSeconds / 60);
		const seconds = avgSeconds % 60;
		return minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;
	}

	function percentOfTotal(count: number, list: NamedCount[]): number {
		const total = list.reduce((sum, item) => sum + item.count, 0);
		return total > 0 ? Math.round((count / total) * 100) : 0;
	}

	$effect(() => {
		const analytics = data.analytics;
		if (!canvas || !analytics) return;

		const formatLabel =
			data.unit === 'hour'
				? (value: string) => new Date(value).toLocaleTimeString(undefined, { hour: 'numeric' })
				: (value: string) => new Date(value).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

		chart?.destroy();
		chart = new Chart(canvas, {
			type: 'bar',
			data: {
				labels: analytics.pageviews.map((point) => formatLabel(point.x)),
				datasets: [
					{
						label: 'Views',
						data: analytics.pageviews.map((point) => point.y),
						backgroundColor: '#006633',
						borderRadius: 4
					},
					{
						label: 'Visitors',
						data: analytics.visitors.map((point) => point.y),
						backgroundColor: '#ffcc33',
						borderRadius: 4
					}
				]
			},
			options: {
				responsive: true,
				maintainAspectRatio: false,
				layout: {
					padding: { top: 16, right: 12, bottom: 4, left: 4 }
				},
				scales: {
					x: {
						stacked: true,
						ticks:
							data.unit === 'hour'
								? { autoSkip: false, maxRotation: 60, minRotation: 45 }
								: { autoSkip: true }
					},
					y: { stacked: true, beginAtZero: true, grace: '10%' }
				},
				plugins: { legend: { position: 'bottom' } }
			}
		});

		return () => chart?.destroy();
	});
</script>

<div class="flex flex-wrap items-center gap-3">
	<div class="flex gap-1 rounded-lg border border-slate-200 p-1">
		{#each rangeOptions as option (option.value)}
			<a
				href="?range={option.value}"
				class="rounded-md px-3 py-1.5 text-sm font-medium transition-colors {data.range === option.value
					? 'bg-gmu-green text-white'
					: 'text-slate-500 hover:text-slate-700'}"
			>
				{option.label}
			</a>
		{/each}
	</div>

	<form method="GET" class="flex items-center gap-2">
		<input type="hidden" name="range" value="custom" />
		<input
			type="date"
			name="start"
			value={data.start || defaultCustomStart}
			max={data.end || defaultCustomEnd}
			required
			class="rounded-lg border-slate-300 text-sm shadow-sm focus:border-gmu-green focus:ring-gmu-green"
		/>
		<span class="text-sm text-muted">to</span>
		<input
			type="date"
			name="end"
			value={data.end || defaultCustomEnd}
			max={defaultCustomEnd}
			required
			class="rounded-lg border-slate-300 text-sm shadow-sm focus:border-gmu-green focus:ring-gmu-green"
		/>
		<button
			type="submit"
			class="btn-primary px-3 py-1.5 text-sm {data.range === 'custom' ? 'ring-2 ring-gmu-green/40' : ''}"
		>
			Apply
		</button>
	</form>
</div>

{#if data.error}
	<div class="card empty-state mt-4">
		<Icon icon="mdi:chart-line-variant" width="32" class="text-red-300" />
		<p>Could not load analytics.</p>
		<p class="text-xs text-red-600">{data.error}</p>
	</div>
{:else if data.analytics}
	{@const analytics = data.analytics}
	<div class="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
		<div class="card p-5">
			<p class="text-xs font-semibold tracking-wide text-muted uppercase">Pageviews</p>
			<p class="mt-2 text-2xl font-bold text-slate-900">{formatNumber(analytics.stats.pageviews)}</p>
		</div>
		<div class="card p-5">
			<p class="text-xs font-semibold tracking-wide text-muted uppercase">Visitors</p>
			<p class="mt-2 text-2xl font-bold text-slate-900">{formatNumber(analytics.stats.visitors)}</p>
		</div>
		<div class="card p-5">
			<p class="text-xs font-semibold tracking-wide text-muted uppercase">Visits</p>
			<p class="mt-2 text-2xl font-bold text-slate-900">{formatNumber(analytics.stats.visits)}</p>
		</div>
		<div class="card p-5">
			<p class="text-xs font-semibold tracking-wide text-muted uppercase">Bounces</p>
			<p class="mt-2 text-2xl font-bold text-slate-900">{formatNumber(analytics.stats.bounces)}</p>
		</div>
		<div class="card p-5">
			<p class="text-xs font-semibold tracking-wide text-muted uppercase">Avg visit time</p>
			<p class="mt-2 text-2xl font-bold text-slate-900">
				{formatDuration(analytics.stats.totaltime, analytics.stats.visits)}
			</p>
		</div>
	</div>

	<div class="card mt-4 p-5">
		<p class="mb-3 text-sm font-semibold text-slate-700">Traffic over time</p>
		<div class="h-72">
			<canvas bind:this={canvas}></canvas>
		</div>
	</div>

	<div class="mt-4 grid gap-4 lg:grid-cols-2">
		{#each [{ title: 'Top pages', icon: 'mdi:file-outline', items: analytics.topPages }, { title: 'Referrers', icon: 'mdi:link-variant', items: analytics.referrers }, { title: 'Browsers', icon: 'mdi:web', items: analytics.browsers }, { title: 'Devices', icon: 'mdi:devices', items: analytics.devices }, { title: 'Countries', icon: 'mdi:earth', items: analytics.countries }] as panel (panel.title)}
			<div class="card p-5">
				<p class="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-700">
					<Icon icon={panel.icon} width="16" />
					{panel.title}
				</p>
				{#if panel.items.length === 0}
					<p class="text-sm text-muted">No data for this range.</p>
				{:else}
					<ul class="space-y-2">
						{#each panel.items as item (item.name)}
							<li class="flex items-center gap-3 text-sm">
								<span class="flex-1 truncate text-slate-700">{item.name}</span>
								<span class="w-10 text-right font-medium text-slate-900">{formatNumber(item.count)}</span>
								<div class="h-1.5 w-16 overflow-hidden rounded-full bg-slate-100">
									<div
										class="h-full rounded-full bg-gmu-green"
										style="width: {percentOfTotal(item.count, panel.items)}%"
									></div>
								</div>
							</li>
						{/each}
					</ul>
				{/if}
			</div>
		{/each}

		<div class="card p-5">
			<p class="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-700">
				<Icon icon="mdi:map-outline" width="16" />
				Visitors by country
			</p>
			{#if VisitorMap}
				<VisitorMap countries={analytics.countries} />
			{:else}
				<div class="h-80 w-full animate-pulse rounded-lg bg-slate-100"></div>
			{/if}
		</div>
	</div>
{/if}
