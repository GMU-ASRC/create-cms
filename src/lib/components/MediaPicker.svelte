<script lang="ts">
	import Icon from '@iconify/svelte';
	import { onMount } from 'svelte';

	let { container, fieldKey }: { container: Record<string, any>; fieldKey: string } = $props();

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

	const selected = $derived((container[fieldKey] ?? []) as string[]);

	const filtered = $derived(
		images.filter((image) => image.filename.toLowerCase().includes(search.trim().toLowerCase()))
	);
	const totalPages = $derived(Math.max(1, Math.ceil(filtered.length / pageSize)));
	const visible = $derived(filtered.slice((page - 1) * pageSize, page * pageSize));

	$effect(() => {
		search;
		page = 1;
	});

	function selectedImages(): MediaImage[] {
		return selected
			.map((path) => images.find((image) => image.path === path) ?? { id: path, filename: path, path })
			.filter(Boolean) as MediaImage[];
	}

	function indexOf(path: string): number {
		return selected.indexOf(path);
	}

	function toggle(path: string) {
		const current = [...selected];
		const at = current.indexOf(path);
		if (at === -1) {
			current.push(path);
		} else {
			current.splice(at, 1);
		}
		container[fieldKey] = current;
	}

	function go(target: number) {
		page = Math.min(totalPages, Math.max(1, target));
	}
</script>

{#if loading}
	<p class="text-sm text-muted">Loading media...</p>
{:else if images.length === 0}
	<p class="text-sm text-muted">
		No images uploaded yet. Add some on the <a href="/admin/media" class="text-gmu-green hover:underline">Media</a> page first.
	</p>
{:else}
	{#if selected.length > 0}
		<div class="mb-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
			<p class="mb-2 text-xs font-semibold tracking-wide text-muted uppercase">
				Selected ({selected.length})
			</p>
			<div class="flex flex-wrap gap-2">
				{#each selectedImages() as image, order (image.path)}
					<button
						type="button"
						onclick={() => toggle(image.path)}
						class="group relative h-16 w-16 overflow-hidden rounded-lg border-2 border-gmu-green"
						title={`${image.filename} (click to remove)`}
					>
						<img src={image.path} alt={image.filename} class="h-full w-full bg-white object-cover" />
						<span class="absolute top-0.5 left-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-gmu-green text-[10px] font-bold text-white shadow">
							{order + 1}
						</span>
						<span class="absolute inset-0 flex items-center justify-center bg-slate-900/0 text-white opacity-0 transition group-hover:bg-slate-900/40 group-hover:opacity-100">
							<Icon icon="mdi:close-circle" width="22" />
						</span>
					</button>
				{/each}
			</div>
		</div>
	{/if}

	<input
		type="text"
		placeholder="Search images by filename..."
		bind:value={search}
		class="field-input mb-3"
	/>

	{#if filtered.length === 0}
		<p class="text-sm text-muted">No images match your search.</p>
	{:else}
		<div class="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
			{#each visible as image (image.id)}
				{@const order = indexOf(image.path)}
				<button
					type="button"
					onclick={() => toggle(image.path)}
					class="group relative overflow-hidden rounded-lg border-2 transition-colors {order === -1
						? 'border-slate-200 hover:border-slate-300'
						: 'border-gmu-green'}"
					title={image.filename}
				>
					<img src={image.path} alt={image.filename} class="h-24 w-full bg-slate-50 object-cover" />
					{#if order !== -1}
						<span class="absolute top-1.5 right-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-gmu-green text-xs font-bold text-white shadow">
							{order + 1}
						</span>
					{:else}
						<span class="absolute inset-0 flex items-center justify-center bg-slate-900/0 text-white opacity-0 transition group-hover:bg-slate-900/30 group-hover:opacity-100">
							<Icon icon="mdi:plus-circle" width="26" />
						</span>
					{/if}
				</button>
			{/each}
		</div>

		{#if totalPages > 1}
			<div class="mt-3 flex items-center justify-between gap-2">
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
	{/if}

	<p class="mt-2 text-xs text-muted">
		Click to select or remove. The number shows the order the images appear in.
	</p>
{/if}
