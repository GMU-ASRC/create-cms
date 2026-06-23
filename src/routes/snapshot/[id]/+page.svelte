<script lang="ts">
	import '../../layout.css';
	import Icon from '@iconify/svelte';

	let { data } = $props();

	const rawUrl = $derived(`/snapshot/${data.snapshot.id}/raw`);
	const isImage = $derived(data.snapshot.contentType.startsWith('image/'));
	const isExternal = $derived(/^https?:\/\//i.test(data.snapshot.url));

	function formatSize(bytes: number): string {
		if (bytes >= 1_000_000) return `${(bytes / 1_000_000).toFixed(1)} MB`;
		if (bytes >= 1000) return `${Math.round(bytes / 1000)} KB`;
		return `${bytes} B`;
	}

	function formatTime(value: string | Date): string {
		const date = new Date(value);
		if (Number.isNaN(date.getTime())) return '';
		return date.toLocaleString('en-US', {
			month: 'short',
			day: 'numeric',
			year: 'numeric',
			hour: 'numeric',
			minute: '2-digit'
		});
	}
</script>

<svelte:head><title>{data.snapshot.title} | Archived snapshot</title></svelte:head>

<div class="flex h-screen flex-col bg-slate-100">
	<header
		class="flex flex-wrap items-center justify-between gap-3 border-b-2 border-gmu-gold bg-gmu-green px-4 py-2.5 text-white"
	>
		<div class="flex min-w-0 items-center gap-2.5">
			<Icon icon="mdi:archive-outline" width="22" class="shrink-0 text-gmu-gold" />
			<div class="min-w-0">
				<p class="truncate text-sm font-semibold" title={data.snapshot.title}>
					{data.snapshot.title}
				</p>
				<p class="truncate text-xs text-white/70">
					Archived {formatTime(data.snapshot.capturedAt)} · {formatSize(data.snapshot.size)} ·
					{#if isExternal}
						<a
							href={data.snapshot.url}
							target="_blank"
							rel="noopener noreferrer"
							class="text-gmu-gold hover:underline"
							title={data.snapshot.url}
						>
							{data.snapshot.url}
						</a>
					{:else}
						<span title={data.snapshot.url}>{data.snapshot.url}</span>
					{/if}
				</p>
			</div>
		</div>
		<div class="flex shrink-0 items-center gap-4 text-xs font-medium">
			<a
				href={rawUrl}
				target="_blank"
				rel="noopener noreferrer"
				class="inline-flex items-center gap-1 text-white/80 hover:text-white"
			>
				<Icon icon="mdi:fullscreen" width="16" />
				Full screen
			</a>
			{#if isExternal}
				<a
					href={data.snapshot.url}
					target="_blank"
					rel="noopener noreferrer"
					class="inline-flex items-center gap-1 text-white/80 hover:text-white"
				>
					<Icon icon="mdi:open-in-new" width="16" />
					Original
				</a>
			{/if}
		</div>
	</header>

	{#if isImage}
		<div class="flex-1 overflow-auto bg-white">
			<img src={rawUrl} alt={data.snapshot.title} class="block w-full" />
		</div>
	{:else}
		<iframe
			src={rawUrl}
			title={data.snapshot.title}
			class="w-full flex-1 bg-white"
			sandbox="allow-same-origin allow-popups"
		></iframe>
	{/if}
</div>
