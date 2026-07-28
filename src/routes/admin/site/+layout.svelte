<script lang="ts">
	import Icon from '@iconify/svelte';
	import { page } from '$app/state';

	let { children } = $props();

	const tabs = [
		{ label: 'Info', href: '/admin/site/info', icon: 'mdi:home-city-outline' },
		{ label: 'Gallery', href: '/admin/site/gallery', icon: 'mdi:view-gallery-outline' },
		{ label: 'Sponsors', href: '/admin/site/sponsors', icon: 'mdi:handshake-outline' }
	];
</script>

<svelte:head><title>Site | CREATE CMS</title></svelte:head>

<h1 class="page-title">Site</h1>
<p class="page-subtitle">Manage general site information, the homepage gallery, and sponsors.</p>

<div class="mt-6 flex gap-1 border-b border-slate-200">
	{#each tabs as tab (tab.href)}
		{@const active = page.url.pathname.startsWith(tab.href)}
		<a
			href={tab.href}
			class="inline-flex items-center gap-1.5 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors {active
				? 'border-gmu-green text-gmu-green'
				: 'border-transparent text-slate-500 hover:text-slate-700'}"
		>
			<Icon icon={tab.icon} width="16" />
			{tab.label}
		</a>
	{/each}
</div>

<div class="mt-6">
	{@render children()}
</div>
