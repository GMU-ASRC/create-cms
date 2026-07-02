<script lang="ts">
	import './layout.css';
	import Icon from '@iconify/svelte';
	import { page } from '$app/state';
	import { browser, dev } from '$app/environment';
	import { injectSpeedInsights } from '@vercel/speed-insights/sveltekit';
	import { injectAnalytics } from '@vercel/analytics/sveltekit';
	import { collections } from '$lib/collections';
	import { iconFor } from '$lib/ui';
	import ConfirmDialog from '$lib/components/ConfirmDialog.svelte';

	injectSpeedInsights();
	injectAnalytics({ mode: dev ? 'development' : 'production' });

	let { children, data } = $props();

	let menuOpen = $state(false);
	let collapsed = $state(browser ? localStorage.getItem('cms_sidebar_collapsed') === '1' : false);

	const logoSrc = $derived(data.logo || '/create_logo.png');

	const navItems = [
		...collections.map((collection) => ({
			label: collection.label,
			href: `/admin/${collection.key}`,
			icon: iconFor(collection.key)
		})),
		{ label: 'Media', href: '/admin/media', icon: iconFor('media') },
		{ label: 'Manage', href: '/admin/manage', icon: 'mdi:shield-account-outline' },
		{ label: 'Profile', href: '/admin/profile', icon: 'mdi:account-cog-outline' }
	];

	function isActive(href: string): boolean {
		if (href === '/') return page.url.pathname === '/';
		return page.url.pathname.startsWith(href);
	}

	function toggleCollapsed() {
		collapsed = !collapsed;
		if (browser) localStorage.setItem('cms_sidebar_collapsed', collapsed ? '1' : '0');
	}

	$effect(() => {
		void page.url.pathname;
		menuOpen = false;
	});
</script>

<svelte:head><link rel="icon" type="image/png" href={logoSrc} /></svelte:head>

<ConfirmDialog />

{#snippet brand(showLabel: boolean)}
	<a href="/" class="flex items-center gap-2.5">
		<span class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white shadow-sm">
			<img src={logoSrc} alt="" class="h-7 w-auto" />
		</span>
		{#if showLabel}
			<span class="text-base font-bold tracking-tight text-white">CREATE CMS</span>
		{/if}
	</a>
{/snippet}

{#snippet navList(showLabels: boolean)}
	<nav class="flex-1 space-y-1 overflow-y-auto p-3">
		{#each navItems as item (item.href)}
			<a
				href={item.href}
				title={showLabels ? undefined : item.label}
				class="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors {isActive(
					item.href
				)
					? 'bg-white text-gmu-green shadow-sm'
					: 'text-white/85 hover:bg-white/10 hover:text-white'} {showLabels ? '' : 'justify-center'}"
			>
				<Icon icon={item.icon} width="20" class="shrink-0" />
				{#if showLabels}<span>{item.label}</span>{/if}
			</a>
		{/each}
	</nav>
	<form method="POST" action="/logout" class="border-t border-white/15 p-3">
		{#if showLabels}
			<a href="/admin/profile" class="block truncate px-2 pb-2 text-xs text-white/60 hover:text-white hover:underline">
				{data.user?.email}
			</a>
		{/if}
		<button
			class="flex w-full items-center justify-center gap-2 rounded-lg border border-white/30 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-white/10"
			title="Sign out"
		>
			<Icon icon="mdi:logout" width="18" />
			{#if showLabels}<span>Sign out</span>{/if}
		</button>
	</form>
{/snippet}

{#if data.user && !page.url.pathname.startsWith('/snapshot/')}
	<div class="flex min-h-screen">
		<aside
			class="sticky top-0 hidden h-screen shrink-0 flex-col self-start bg-gmu-green text-white transition-[width] duration-200 md:flex {collapsed
				? 'w-16'
				: 'w-60'}"
		>
			<div class="absolute inset-y-0 right-0 w-1 bg-gmu-gold"></div>
			<div
				class="flex items-center border-b border-white/15 px-3 py-4 {collapsed
					? 'justify-center'
					: 'justify-between gap-2 px-5'}"
			>
				{#if !collapsed}{@render brand(true)}{/if}
				<button
					class="rounded-lg p-1.5 text-white/70 hover:bg-white/10 hover:text-white"
					aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
					onclick={toggleCollapsed}
				>
					<Icon icon={collapsed ? 'mdi:chevron-right' : 'mdi:chevron-left'} width="20" />
				</button>
			</div>
			{@render navList(!collapsed)}
		</aside>

		<header
			class="fixed inset-x-0 top-0 z-30 flex items-center justify-between border-b border-gmu-green-dark bg-gmu-green px-4 py-3 md:hidden"
		>
			{@render brand(true)}
			<button
				class="rounded-lg p-2 text-white hover:bg-white/10"
				aria-label="Toggle navigation"
				aria-expanded={menuOpen}
				onclick={() => (menuOpen = !menuOpen)}
			>
				<Icon icon={menuOpen ? 'mdi:close' : 'mdi:menu'} width="24" />
			</button>
		</header>

		{#if menuOpen}
			<button
				class="animate-fade-in fixed inset-0 z-30 bg-slate-900/50 md:hidden"
				aria-label="Close navigation"
				onclick={() => (menuOpen = false)}
			></button>
			<aside
				class="animate-drawer-in fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r-4 border-gmu-gold bg-gmu-green text-white shadow-xl md:hidden"
			>
				<div class="border-b border-white/15 px-5 py-4">{@render brand(true)}</div>
				{@render navList(true)}
			</aside>
		{/if}

		<main class="flex-1 overflow-x-hidden px-4 pt-20 pb-10 sm:px-6 md:p-10">
			<div class="mx-auto max-w-5xl">
				{@render children()}
			</div>
		</main>
	</div>
{:else}
	{@render children()}
{/if}
