<script lang="ts">
	import Icon from '@iconify/svelte';
	import { onMount } from 'svelte';

	let { onSelect, onClose }: { onSelect: (path: string) => void; onClose: () => void } = $props();

	type MediaImage = { id: string; filename: string; path: string };

	const pageSize = 12;

	let images = $state<MediaImage[]>([]);
	let loading = $state(true);
	let search = $state('');
	let page = $state(1);

	onMount(async () => {
		try {
			const response = await fetch('/admin/media/list');
			if (response.ok) {
				images = (await response.json()) as MediaImage[];
			}
		} finally {
			loading = false;
		}
	});

	const filtered = $derived(
		images.filter((image) => image.filename.toLowerCase().includes(search.trim().toLowerCase()))
	);
	const totalPages = $derived(Math.max(1, Math.ceil(filtered.length / pageSize)));
	const visible = $derived(filtered.slice((page - 1) * pageSize, page * pageSize));

	$effect(() => {
		search;
		page = 1;
	});

	function go(target: number) {
		page = Math.min(totalPages, Math.max(1, target));
	}
</script>

<div class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
	<div class="flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-xl bg-white shadow-xl">
		<div class="flex items-center justify-between border-b border-slate-200 px-4 py-3">
			<h2 class="font-semibold text-slate-900">Choose from media</h2>
			<button
				type="button"
				class="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
				aria-label="Close"
				onclick={onClose}
			>
				<Icon icon="mdi:close" width="20" />
			</button>
		</div>

		<div class="border-b border-slate-200 px-4 py-3">
			<input
				type="text"
				placeholder="Search images by filename..."
				bind:value={search}
				class="field-input"
			/>
		</div>

		<div class="flex-1 overflow-y-auto p-4">
			{#if loading}
				<p class="text-sm text-muted">Loading media...</p>
			{:else if images.length === 0}
				<p class="text-sm text-muted">
					No images uploaded yet. Add some on the
					<a href="/admin/media" class="text-gmu-green hover:underline">Media</a> page.
				</p>
			{:else if filtered.length === 0}
				<p class="text-sm text-muted">No images match your search.</p>
			{:else}
				<div class="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
					{#each visible as image (image.id)}
						<button
							type="button"
							onclick={() => onSelect(image.path)}
							class="overflow-hidden rounded-lg border-2 border-slate-200 transition-colors hover:border-gmu-green"
							title={image.filename}
						>
							<img src={image.path} alt={image.filename} class="h-24 w-full bg-slate-50 object-cover" />
						</button>
					{/each}
				</div>
			{/if}
		</div>

		{#if !loading && totalPages > 1}
			<div class="flex items-center justify-between gap-2 border-t border-slate-200 px-4 py-3">
				<button
					type="button"
					class="btn-secondary disabled:cursor-not-allowed disabled:opacity-40"
					disabled={page === 1}
					onclick={() => go(page - 1)}
				>
					<Icon icon="mdi:chevron-left" width="16" />
					Prev
				</button>
				<span class="text-xs text-muted">Page {page} of {totalPages}</span>
				<button
					type="button"
					class="btn-secondary disabled:cursor-not-allowed disabled:opacity-40"
					disabled={page === totalPages}
					onclick={() => go(page + 1)}
				>
					Next
					<Icon icon="mdi:chevron-right" width="16" />
				</button>
			</div>
		{/if}
	</div>
</div>
