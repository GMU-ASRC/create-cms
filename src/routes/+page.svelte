<script lang="ts">
	import Icon from '@iconify/svelte';
	import { iconFor, tintFor } from '$lib/ui';

	let { data } = $props();
</script>

<svelte:head><title>Dashboard | CREATE CMS</title></svelte:head>

<p class="eyebrow">Overview</p>
<h1 class="page-title mt-1">Dashboard</h1>
<p class="page-subtitle">Manage the content the CREATE Lab website pulls from.</p>

<div class="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
	{#each data.counts as item (item.key)}
		<a href={`/admin/${item.key}`} class="card card-hover group flex items-center gap-4 p-5">
			<span class="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg {tintFor(item.key)}">
				<Icon icon={iconFor(item.key)} width="24" />
			</span>
			<div>
				<div class="text-2xl font-bold leading-none">
					{item.singleton ? (item.count > 0 ? 'Set' : 'Empty') : item.count}
				</div>
				<div class="mt-1 text-sm font-medium text-muted">{item.label}</div>
			</div>
			<Icon
				icon="mdi:arrow-right"
				width="20"
				class="ml-auto text-slate-300 transition-colors group-hover:text-gmu-green"
			/>
		</a>
	{/each}
</div>
