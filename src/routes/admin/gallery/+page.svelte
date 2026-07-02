<script lang="ts">
	import { untrack } from 'svelte';
	import Icon from '@iconify/svelte';
	import { iconFor, tintFor } from '$lib/ui';

	let { data, form } = $props();

	type GalleryItem = { id?: string; image: string; title: string; type?: string };

	const videoExtensions = /\.(mp4|webm|ogg|ogv|mov|m4v)$/i;

	function isVideo(item: { type?: string; image: string }): boolean {
		if (item.type) return item.type.startsWith('video/');
		return videoExtensions.test(item.image);
	}

	function isVideoMedia(media: { contentType: string; path: string }): boolean {
		if (media.contentType) return media.contentType.startsWith('video/');
		return videoExtensions.test(media.path);
	}

	let items = $state<GalleryItem[]>(untrack(() => structuredClone(data.items)));
	const serialized = $derived(JSON.stringify(items));

	let showPicker = $state(false);
	let picked = $state<string[]>([]);
	let search = $state('');
	let uploading = $state(false);
	let uploadError = $state('');
	let dragIndex = $state<number | null>(null);

	const inGallery = $derived(new Set(items.map((item) => item.image)));
	const mediaResults = $derived(
		data.media.filter((image) =>
			image.filename.toLowerCase().includes(search.trim().toLowerCase())
		)
	);

	function openPicker() {
		picked = [];
		search = '';
		showPicker = true;
	}

	function togglePick(path: string) {
		picked = picked.includes(path) ? picked.filter((value) => value !== path) : [...picked, path];
	}

	function addPicked() {
		for (const path of picked) {
			if (!items.some((item) => item.image === path)) {
				const media = data.media.find((entry) => entry.path === path);
				items.push({ image: path, title: '', type: media?.contentType ?? '' });
			}
		}
		showPicker = false;
	}

	function removeItem(index: number) {
		items.splice(index, 1);
	}

	function onDragStart(index: number) {
		dragIndex = index;
	}
	function onDragOver(event: DragEvent, index: number) {
		event.preventDefault();
		if (dragIndex === null || dragIndex === index) return;
		const [moved] = items.splice(dragIndex, 1);
		items.splice(index, 0, moved);
		dragIndex = index;
	}

	async function onUpload(event: Event) {
		const input = event.target as HTMLInputElement;
		const file = input.files?.[0];
		input.value = '';
		if (!file) return;
		uploading = true;
		uploadError = '';
		try {
			const body = new FormData();
			body.append('file', file);
			const response = await fetch('/admin/upload', { method: 'POST', body });
			if (!response.ok) throw new Error('Upload failed');
			const result = await response.json();
			items.push({ image: result.path, title: '', type: file.type });
		} catch {
			uploadError = 'Upload failed. Try again.';
		} finally {
			uploading = false;
		}
	}
</script>

<svelte:head><title>Gallery | CREATE CMS</title></svelte:head>

<div class="flex flex-wrap items-center justify-between gap-4">
	<div class="flex items-center gap-3">
		<span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg {tintFor('gallery')}">
			<Icon icon={iconFor('gallery')} width="22" />
		</span>
		<div>
			<h1 class="page-title">Gallery</h1>
			<p class="text-sm text-muted">
				{items.length}
				{items.length === 1 ? 'item' : 'items'}
			</p>
		</div>
	</div>
	<div class="flex items-center gap-2">
		<button type="button" class="btn-secondary" onclick={openPicker}>
			<Icon icon="mdi:image-multiple-outline" width="18" />
			Add from media
		</button>
		<label class="btn-secondary cursor-pointer">
			<Icon icon="mdi:upload" width="18" />
			{uploading ? 'Uploading...' : 'Upload'}
			<input type="file" accept="image/*,video/*" class="hidden" onchange={onUpload} disabled={uploading} />
		</label>
	</div>
</div>

{#if uploadError}<p class="alert-error mt-3">{uploadError}</p>{/if}
{#if form?.success}<p class="mt-3 text-sm text-gmu-green">Gallery saved.</p>{/if}

<form method="POST" action="?/save" class="mt-6">
	<input type="hidden" name="items" value={serialized} />

	{#if items.length === 0}
		<div class="card empty-state">
			<Icon icon="mdi:image-off-outline" width="32" class="text-slate-300" />
			<p>No media yet. Add from media or upload to start the gallery.</p>
		</div>
	{:else}
		<div class="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4" role="list">
			{#each items as item, index (item.id ?? item.image)}
				<div
					class="card flex flex-col overflow-hidden p-0 {dragIndex === index ? 'opacity-60' : ''}"
					ondragover={(event) => onDragOver(event, index)}
					ondragend={() => (dragIndex = null)}
					ondrop={() => (dragIndex = null)}
					role="listitem"
				>
					<div class="group relative">
						{#if isVideo(item)}
							<video src={item.image} class="h-32 w-full bg-slate-900 object-cover" muted preload="metadata"></video>
							<span class="pointer-events-none absolute inset-0 flex items-center justify-center text-white/90">
								<Icon icon="mdi:play-circle-outline" width="32" />
							</span>
						{:else}
							<img src={item.image} alt="" class="h-32 w-full bg-slate-50 object-cover" />
						{/if}
						<span
							class="absolute top-1.5 left-1.5 cursor-grab rounded bg-slate-900/50 p-0.5 text-white"
							draggable="true"
							ondragstart={() => onDragStart(index)}
							role="button"
							tabindex="-1"
							aria-label="Drag to reorder"
						>
							<Icon icon="mdi:drag" width="16" />
						</span>
						<button
							type="button"
							class="absolute top-1.5 right-1.5 rounded-full bg-slate-900/60 p-1 text-white hover:bg-red-600"
							aria-label="Remove"
							onclick={() => removeItem(index)}
						>
							<Icon icon="mdi:close" width="14" />
						</button>
					</div>
					<input
						class="field-input rounded-none border-x-0 border-b-0 text-xs"
						type="text"
						placeholder="Caption (optional)"
						bind:value={item.title}
					/>
				</div>
			{/each}
		</div>
	{/if}

	<div class="mt-6 flex items-center gap-3">
		<button class="btn-primary">
			<Icon icon="mdi:content-save-outline" width="18" />
			Save gallery
		</button>
	</div>
</form>

{#if showPicker}
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
		<div class="flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-xl bg-white shadow-xl">
			<div class="flex items-center justify-between border-b border-slate-200 px-4 py-3">
				<h2 class="font-semibold text-slate-900">Add from media</h2>
				<button
					type="button"
					class="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
					aria-label="Close"
					onclick={() => (showPicker = false)}
				>
					<Icon icon="mdi:close" width="20" />
				</button>
			</div>
			<div class="border-b border-slate-200 px-4 py-3">
				<input
					type="text"
					placeholder="Search media by filename..."
					bind:value={search}
					class="field-input"
				/>
			</div>
			<div class="flex-1 overflow-y-auto p-4">
				{#if data.media.length === 0}
					<p class="text-sm text-muted">
						No media uploaded yet. Add some on the
						<a href="/admin/media" class="text-gmu-green hover:underline">Media</a> page.
					</p>
				{:else if mediaResults.length === 0}
					<p class="text-sm text-muted">No media match your search.</p>
				{:else}
					<div class="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
						{#each mediaResults as image (image.id)}
							{@const selected = picked.includes(image.path)}
							{@const already = inGallery.has(image.path)}
							<button
								type="button"
								onclick={() => togglePick(image.path)}
								class="group relative overflow-hidden rounded-lg border-2 transition-colors {selected
									? 'border-gmu-green'
									: 'border-slate-200 hover:border-slate-300'}"
								title={image.filename}
							>
								{#if isVideoMedia(image)}
									<video src={image.path} class="h-24 w-full bg-slate-900 object-cover" muted preload="metadata"></video>
									<span class="pointer-events-none absolute inset-0 flex items-center justify-center text-white/90">
										<Icon icon="mdi:play-circle-outline" width="28" />
									</span>
								{:else}
									<img src={image.path} alt={image.filename} class="h-24 w-full bg-slate-50 object-cover" />
								{/if}
								{#if selected}
									<span class="absolute top-1.5 right-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-gmu-green text-white shadow">
										<Icon icon="mdi:check" width="16" />
									</span>
								{:else if already}
									<span class="absolute inset-x-0 bottom-0 bg-slate-900/60 py-0.5 text-center text-[10px] font-medium text-white">
										In gallery
									</span>
								{/if}
							</button>
						{/each}
					</div>
				{/if}
			</div>
			<div class="flex items-center justify-end gap-3 border-t border-slate-200 px-4 py-3">
				<button type="button" class="btn-secondary" onclick={() => (showPicker = false)}>Cancel</button>
				<button type="button" class="btn-primary" disabled={picked.length === 0} onclick={addPicked}>
					Add {picked.length || ''} item{picked.length === 1 ? '' : 's'}
				</button>
			</div>
		</div>
	</div>
{/if}
