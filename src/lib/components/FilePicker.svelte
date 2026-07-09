<script lang="ts">
	import Icon from '@iconify/svelte';
	import { onMount } from 'svelte';
	import { uploadToStorage } from '$lib/upload';

	let { container, fieldKey }: { container: Record<string, any>; fieldKey: string } = $props();

	type FileEntry = { id: string; filename: string; path: string; contentType: string };
	type Selected = { name: string; path: string };

	const pageSize = 12;

	let files = $state<FileEntry[]>([]);
	let loading = $state(true);
	let search = $state('');
	let page = $state(1);
	let uploading = $state(false);
	let uploadError = $state('');
	let dragIndex = $state<number | null>(null);

	const selected = $derived((container[fieldKey] ?? []) as Selected[]);

	onMount(async () => {
		try {
			const response = await fetch('/admin/files/list');
			if (response.ok) files = (await response.json()) as FileEntry[];
		} finally {
			loading = false;
		}
	});

	const filtered = $derived(
		files.filter((file) => file.filename.toLowerCase().includes(search.trim().toLowerCase()))
	);
	const totalPages = $derived(Math.max(1, Math.ceil(filtered.length / pageSize)));
	const visible = $derived(filtered.slice((page - 1) * pageSize, page * pageSize));

	$effect(() => {
		search;
		page = 1;
	});

	function iconFor(name: string): string {
		const ext = name.split('.').pop()?.toLowerCase() ?? '';
		if (ext === 'pdf') return 'mdi:file-pdf-box';
		if (['zip', 'rar', '7z', 'tar', 'gz', 'bz2'].includes(ext)) return 'mdi:folder-zip-outline';
		if (['doc', 'docx', 'odt', 'rtf'].includes(ext)) return 'mdi:file-word-outline';
		if (['xls', 'xlsx', 'csv', 'ods'].includes(ext)) return 'mdi:file-excel-outline';
		if (['ppt', 'pptx', 'odp'].includes(ext)) return 'mdi:file-powerpoint-outline';
		if (['txt', 'md'].includes(ext)) return 'mdi:file-document-outline';
		if (['mp3', 'wav', 'ogg', 'flac', 'm4a', 'aac'].includes(ext)) return 'mdi:file-music-outline';
		if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'avif'].includes(ext)) return 'mdi:file-image-outline';
		if (['mp4', 'webm', 'mov', 'mkv', 'avi', 'm4v'].includes(ext)) return 'mdi:file-video-outline';
		return 'mdi:file-outline';
	}

	function isSelected(path: string): boolean {
		return selected.some((item) => item.path === path);
	}

	function toggle(file: FileEntry) {
		const current = [...selected];
		const at = current.findIndex((item) => item.path === file.path);
		if (at === -1) current.push({ name: file.filename, path: file.path });
		else current.splice(at, 1);
		container[fieldKey] = current;
	}

	function removeAt(index: number) {
		const current = [...selected];
		current.splice(index, 1);
		container[fieldKey] = current;
	}

	function go(target: number) {
		page = Math.min(totalPages, Math.max(1, target));
	}

	async function onUpload(event: Event) {
		const input = event.target as HTMLInputElement;
		const file = input.files?.[0];
		input.value = '';
		if (!file) return;
		if (file.type.startsWith('image/') || file.type.startsWith('video/')) {
			uploadError = 'Images and videos belong in the Gallery, not Files.';
			return;
		}
		uploading = true;
		uploadError = '';
		try {
			const result = await uploadToStorage(file);
			files = [
				{ id: result.id, filename: file.name, path: result.path, contentType: file.type },
				...files
			];
			container[fieldKey] = [...selected, { name: file.name, path: result.path }];
		} catch {
			uploadError = 'Upload failed. Try again.';
		} finally {
			uploading = false;
		}
	}

	function onDragStart(index: number) {
		dragIndex = index;
	}

	function onDragOver(event: DragEvent, index: number) {
		event.preventDefault();
		if (dragIndex === null || dragIndex === index) return;
		const current = [...selected];
		const [moved] = current.splice(dragIndex, 1);
		current.splice(index, 0, moved);
		container[fieldKey] = current;
		dragIndex = index;
	}
</script>

{#if selected.length > 0}
	<div class="mb-3 space-y-2">
		{#each selected as item, index (item.path)}
			<div
				class="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 {dragIndex ===
				index
					? 'opacity-50'
					: ''}"
				ondragover={(event) => onDragOver(event, index)}
				ondrop={() => (dragIndex = null)}
				ondragend={() => (dragIndex = null)}
				role="listitem"
			>
				<span
					class="cursor-grab text-slate-400 hover:text-slate-600"
					draggable="true"
					ondragstart={() => onDragStart(index)}
					role="button"
					tabindex="-1"
					aria-label="Drag to reorder"
				>
					<Icon icon="mdi:drag-vertical" width="18" />
				</span>
				<Icon icon={iconFor(item.name)} width="20" class="shrink-0 text-gmu-green" />
				<a
					href={item.path}
					target="_blank"
					rel="noopener noreferrer"
					class="min-w-0 flex-1 truncate text-sm text-slate-700 hover:text-gmu-green hover:underline"
					title={item.name}
				>
					{item.name}
				</a>
				<button
					type="button"
					class="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
					aria-label="Remove"
					onclick={() => removeAt(index)}
				>
					<Icon icon="mdi:close" width="18" />
				</button>
			</div>
		{/each}
	</div>
{/if}

<div class="mb-3 flex flex-wrap items-center gap-2">
	<label class="btn-secondary cursor-pointer">
		<Icon icon="mdi:upload" width="16" />
		{uploading ? 'Uploading...' : 'Upload file'}
		<input type="file" class="hidden" onchange={onUpload} disabled={uploading} />
	</label>
	{#if uploadError}<span class="text-xs text-red-600">{uploadError}</span>{/if}
</div>

{#if loading}
	<p class="text-sm text-muted">Loading files...</p>
{:else if files.length === 0}
	<p class="text-sm text-muted">
		No files uploaded yet. Upload one above or add some on the
		<a href="/admin/media" class="text-gmu-green hover:underline">Media</a> page.
	</p>
{:else}
	<input
		type="text"
		placeholder="Search files by filename..."
		bind:value={search}
		class="field-input mb-3"
	/>
	{#if filtered.length === 0}
		<p class="text-sm text-muted">No files match your search.</p>
	{:else}
		<div class="space-y-1.5">
			{#each visible as file (file.id)}
				{@const chosen = isSelected(file.path)}
				<button
					type="button"
					onclick={() => toggle(file)}
					class="flex w-full items-center gap-2 rounded-lg border px-3 py-2 text-left transition-colors {chosen
						? 'border-gmu-green bg-gmu-green-light'
						: 'border-slate-200 hover:border-slate-300'}"
					title={file.filename}
				>
					<Icon
						icon={chosen ? 'mdi:check-circle' : iconFor(file.filename)}
						width="20"
						class="shrink-0 {chosen ? 'text-gmu-green' : 'text-slate-400'}"
					/>
					<span class="min-w-0 flex-1 truncate text-sm text-slate-700">{file.filename}</span>
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
	<p class="mt-2 text-xs text-muted">Click a file to attach or remove it. Drag attached files to reorder.</p>
{/if}
