<script lang="ts">
	import Icon from '@iconify/svelte';
	import { page } from '$app/state';

	let { children } = $props();

	const tabs = [
		{ label: 'Account', href: '/admin/profile/account', icon: 'mdi:account-cog-outline' },
		{ label: 'API Docs', href: '/admin/profile/api-docs', icon: 'mdi:api' }
	];
</script>

<svelte:head><title>Profile | CREATE CMS</title></svelte:head>

<h1 class="page-title">Profile</h1>
<p class="page-subtitle">Update your login and review the public content API.</p>

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
