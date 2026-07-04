<script lang="ts">
	import Icon from '@iconify/svelte';
	import { enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import { confirmSubmit } from '$lib/confirm';

	let { data, form } = $props();

	let mediaInput = $state<HTMLInputElement | null>(null);
	let mediaUploading = $state(false);
	let mediaProgress = $state(0);
	let mediaError = $state('');

	function safeJson(text: string): Record<string, unknown> | null {
		try {
			const value = JSON.parse(text);
			return value && typeof value === 'object' ? (value as Record<string, unknown>) : null;
		} catch {
			return null;
		}
	}

	function uploadMedia(event: SubmitEvent) {
		event.preventDefault();
		const file = mediaInput?.files?.[0];
		if (!file) {
			mediaError = 'Choose a file to upload';
			return;
		}
		mediaError = '';
		mediaUploading = true;
		mediaProgress = 0;

		const body = new FormData();
		body.append('file', file);

		const request = new XMLHttpRequest();
		request.open('POST', '/admin/upload');
		request.upload.onprogress = (progressEvent) => {
			if (progressEvent.lengthComputable) {
				mediaProgress = Math.round((progressEvent.loaded / progressEvent.total) * 100);
			}
		};
		request.onload = async () => {
			mediaUploading = false;
			if (request.status >= 200 && request.status < 300) {
				mediaProgress = 100;
				if (mediaInput) mediaInput.value = '';
				await invalidateAll();
				mediaProgress = 0;
			} else {
				const parsed = safeJson(request.responseText);
				mediaError = typeof parsed?.message === 'string' ? parsed.message : 'Upload failed';
			}
		};
		request.onerror = () => {
			mediaUploading = false;
			mediaError = 'Upload failed';
		};
		request.send(body);
	}

	let copiedId = $state('');
	let copiedLink = $state('');
	let copiedSnapshot = $state('');
	let capturing = $state(false);
	let uploadingFile = $state(false);
	let dropActive = $state(false);
	let droppedName = $state('');
	let fileInput = $state<HTMLInputElement | null>(null);
	let filter = $state<'all' | 'image' | 'video' | 'pdf' | 'other' | 'unused' | 'links' | 'snapshots'>(
		'all'
	);
	let preview = $state<{ id: string; filename: string; contentType?: string } | null>(null);

	function isExternalUrl(value: string): boolean {
		return /^https?:\/\//i.test(value);
	}

	function handleDrop(event: DragEvent) {
		event.preventDefault();
		dropActive = false;
		const files = event.dataTransfer?.files;
		if (files && files.length > 0 && fileInput) {
			fileInput.files = files;
			droppedName = files[0].name;
		}
	}

	const filters = [
		{ key: 'all', label: 'All' },
		{ key: 'image', label: 'Images' },
		{ key: 'video', label: 'Videos' },
		{ key: 'pdf', label: 'PDFs' },
		{ key: 'other', label: 'Other' },
		{ key: 'unused', label: 'Unused' },
		{ key: 'links', label: 'Links' },
		{ key: 'snapshots', label: 'Snapshots' }
	] as const;

	function kind(contentType: string | undefined): 'image' | 'video' | 'pdf' | 'other' {
		if (contentType?.startsWith('image/')) return 'image';
		if (contentType?.startsWith('video/')) return 'video';
		if (contentType === 'application/pdf') return 'pdf';
		return 'other';
	}

	let search = $state('');

	const rank: Record<string, number> = { image: 0, video: 1, pdf: 2, other: 3 };
	const sorted = $derived(
		[...data.files].sort((a, b) => rank[kind(a.contentType)] - rank[kind(b.contentType)])
	);
	const visible = $derived.by(() => {
		let list = sorted;
		if (filter === 'image' || filter === 'video' || filter === 'pdf' || filter === 'other') {
			list = list.filter((file) => kind(file.contentType) === filter);
		} else if (filter === 'unused') {
			list = list.filter((file) => !file.used);
		}
		const term = search.trim().toLowerCase();
		if (term) {
			list = list.filter((file) => file.filename.toLowerCase().includes(term));
		}
		return list;
	});

	const pageSize = 24;
	let mediaPage = $state(1);
	const pageCount = $derived(Math.max(1, Math.ceil(visible.length / pageSize)));
	const paged = $derived(visible.slice((mediaPage - 1) * pageSize, mediaPage * pageSize));

	$effect(() => {
		void filter;
		void search;
		mediaPage = 1;
	});

	$effect(() => {
		if (mediaPage > pageCount) mediaPage = pageCount;
	});

	function countFor(
		key: 'all' | 'image' | 'video' | 'pdf' | 'other' | 'unused' | 'links' | 'snapshots'
	): number {
		if (key === 'links') return data.links.length;
		if (key === 'snapshots') return data.snapshots.length;
		if (key === 'all') return data.files.length;
		if (key === 'unused') return data.files.filter((file) => !file.used).length;
		return data.files.filter((file) => kind(file.contentType) === key).length;
	}

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

	function shortUrl(slug: string): string {
		const origin = typeof window === 'undefined' ? '' : window.location.origin;
		return `${origin}/l/${slug}`;
	}

	async function copyLink(slug: string) {
		await navigator.clipboard.writeText(shortUrl(slug));
		copiedLink = slug;
		setTimeout(() => (copiedLink = ''), 1500);
	}

	function snapshotUrl(id: string): string {
		const origin = typeof window === 'undefined' ? '' : window.location.origin;
		return `${origin}/snapshot/${id}`;
	}

	async function copySnapshot(id: string) {
		await navigator.clipboard.writeText(snapshotUrl(id));
		copiedSnapshot = id;
		setTimeout(() => (copiedSnapshot = ''), 1500);
	}

	function isImage(contentType: string | undefined): boolean {
		return Boolean(contentType && contentType.startsWith('image/'));
	}

	function isVideo(contentType: string | undefined): boolean {
		return Boolean(contentType && contentType.startsWith('video/'));
	}

	function isPdf(contentType: string | undefined): boolean {
		return contentType === 'application/pdf';
	}

	function extensionOf(filename: string): string {
		const dot = filename.lastIndexOf('.');
		return dot === -1 ? 'file' : filename.slice(dot + 1).toLowerCase();
	}

	function openPreview(file: { id: string; filename: string; contentType?: string }) {
		preview = file;
	}

	function closePreview() {
		preview = null;
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape') closePreview();
	}

	async function copyPath(id: string) {
		await navigator.clipboard.writeText(`/api/files/${id}`);
		copiedId = id;
		setTimeout(() => (copiedId = ''), 1500);
	}

	function confirmDelete(event: SubmitEvent, file: { filename: string; used?: boolean }) {
		const message = file.used
			? `"${file.filename}" is used somewhere in the CMS. Deleting it will break those references. Delete anyway?`
			: `Delete "${file.filename}"?`;
		confirmSubmit(event, { title: 'Delete file', message, danger: true, confirmLabel: 'Delete' });
	}
</script>

<svelte:head><title>Media | CREATE CMS</title></svelte:head>

<svelte:window onkeydown={handleKeydown} />

<h1 class="page-title">Media</h1>
<p class="page-subtitle">
	Upload images, videos, documents, and other files, create short redirect links, or archive a snapshot of a web page.
</p>

<div class="mt-6 flex flex-wrap items-center gap-2">
	{#each filters as option (option.key)}
		<button
			type="button"
			onclick={() => (filter = option.key)}
			class="inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm font-medium transition-colors {filter ===
			option.key
				? 'border-gmu-green bg-gmu-green text-white'
				: 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'}"
		>
			{option.label}
			<span class="text-xs {filter === option.key ? 'text-white/80' : 'text-slate-400'}">
				{countFor(option.key)}
			</span>
		</button>
	{/each}
</div>

{#if filter === 'links'}
	<form
		method="POST"
		action="?/createLink"
		use:enhance
		class="card mt-6 grid gap-3 p-4 sm:grid-cols-[1fr_2fr_auto] sm:items-end"
	>
		<div>
			<label class="field-label" for="slug">Short code</label>
			<input
				id="slug"
				name="slug"
				class="field-input"
				autocomplete="off"
				placeholder="optional, e.g. demo"
			/>
		</div>
		<div>
			<label class="field-label" for="url">Redirect to</label>
			<input
				id="url"
				name="url"
				class="field-input"
				placeholder="https://example.com/some/long/url"
				required
			/>
		</div>
		<button class="btn-primary w-full sm:w-auto">
			<Icon icon="mdi:link-plus" width="18" />
			Create link
		</button>
		{#if form?.linkError}
			<p class="alert-error sm:col-span-3">{form.linkError}</p>
		{/if}
	</form>

	{#if data.links.length === 0}
		<div class="card empty-state mt-6">
			<Icon icon="mdi:link-off" width="32" class="text-slate-300" />
			<p>No links yet. Create one above to get a short redirect.</p>
		</div>
	{:else}
		<div class="card mt-6 overflow-hidden">
			<ul class="divide-y divide-slate-100">
				{#each data.links as link (link.id)}
					<li class="flex items-center justify-between gap-3 px-5 py-3.5">
						<div class="min-w-0">
							<button
								type="button"
								onclick={() => copyLink(link.slug)}
								class="flex items-center gap-1.5 text-sm font-medium text-gmu-green hover:underline"
								title="Copy short link"
							>
								<Icon
									icon={copiedLink === link.slug ? 'mdi:check' : 'mdi:content-copy'}
									width="14"
									class="shrink-0"
								/>
								/l/{link.slug}
							</button>
							<a
								href={link.url}
								target="_blank"
								rel="noopener noreferrer"
								class="block truncate text-xs text-muted hover:text-gmu-green"
								title={link.url}
							>
								{link.url}
							</a>
						</div>
						<div class="flex shrink-0 items-center gap-4">
							<a
								href={`/l/${link.slug}`}
								target="_blank"
								rel="noopener noreferrer"
								class="text-slate-400 hover:text-gmu-green"
								aria-label="Open link"
								title="Open"
							>
								<Icon icon="mdi:open-in-new" width="16" />
							</a>
							<form method="POST" action="?/deleteLink" use:enhance>
								<input type="hidden" name="id" value={link.id} />
								<button class="flex items-center gap-1 text-xs font-medium text-red-600 hover:underline">
									<Icon icon="mdi:trash-can-outline" width="14" />
									Delete
								</button>
							</form>
						</div>
					</li>
				{/each}
			</ul>
		</div>
	{/if}
{:else if filter === 'snapshots'}
	<form
		method="POST"
		action="?/capture"
		use:enhance={() => {
			capturing = true;
			return async ({ update }) => {
				await update();
				capturing = false;
			};
		}}
		class="card mt-6 flex flex-col gap-3 p-4 sm:flex-row sm:items-center"
	>
		<input
			name="url"
			type="url"
			required
			placeholder="https://example.com/page-to-archive"
			class="field-input"
		/>
		<button class="btn-primary w-full shrink-0 sm:w-auto" disabled={capturing}>
			<Icon
				icon={capturing ? 'mdi:loading' : 'mdi:camera-outline'}
				width="18"
				class={capturing ? 'animate-spin' : ''}
			/>
			{capturing ? 'Archiving...' : 'Archive page'}
		</button>
	</form>

	<form
		method="POST"
		action="?/uploadSnapshot"
		enctype="multipart/form-data"
		use:enhance={() => {
			uploadingFile = true;
			return async ({ update }) => {
				await update();
				uploadingFile = false;
				droppedName = '';
			};
		}}
		class="card mt-3 flex flex-col gap-3 p-4"
	>
		<label
			class="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 py-8 text-center transition-colors {dropActive
				? 'border-gmu-green bg-gmu-green-light'
				: 'border-slate-300 hover:border-gmu-green/60'}"
			ondragover={(event) => {
				event.preventDefault();
				dropActive = true;
			}}
			ondragleave={() => (dropActive = false)}
			ondrop={handleDrop}
		>
			<input
				bind:this={fileInput}
				name="snapshotFile"
				type="file"
				accept="text/html,.html,.htm,image/*,application/pdf,.pdf"
				required
				class="hidden"
				onchange={() => (droppedName = fileInput?.files?.[0]?.name ?? '')}
			/>
			<Icon icon="mdi:cloud-upload-outline" width="32" class="text-gmu-green" />
			{#if droppedName}
				<p class="text-sm font-medium text-slate-700">{droppedName}</p>
			{:else}
				<p class="text-sm font-medium text-slate-700">
					Drag and drop an HTML, image, or PDF file here
				</p>
				<p class="text-xs text-muted">or click to browse</p>
			{/if}
		</label>
		<button class="btn-secondary w-full shrink-0 sm:w-auto sm:self-end" disabled={uploadingFile}>
			<Icon
				icon={uploadingFile ? 'mdi:loading' : 'mdi:file-upload-outline'}
				width="18"
				class={uploadingFile ? 'animate-spin' : ''}
			/>
			{uploadingFile ? 'Uploading...' : 'Upload'}
		</button>
	</form>

	{#if form?.snapshotError}
		<p class="alert-error mt-3">{form.snapshotError}</p>
	{/if}

	{#if data.snapshots.length === 0}
		<div class="card empty-state mt-6">
			<Icon icon="mdi:archive-outline" width="32" class="text-slate-300" />
			<p>No snapshots yet. Archive a page above to capture a self-contained copy.</p>
		</div>
	{:else}
		<div class="card mt-6 overflow-hidden">
			<ul class="divide-y divide-slate-100">
				{#each data.snapshots as snapshot (snapshot.id)}
					<li class="flex items-center justify-between gap-3 px-5 py-3.5">
						<div class="min-w-0">
							<p class="truncate text-sm font-medium text-slate-900" title={snapshot.title}>
								{snapshot.title}
							</p>
							<p class="truncate text-xs text-muted">
								{#if isExternalUrl(snapshot.url)}
									<a
										href={snapshot.url}
										target="_blank"
										rel="noopener noreferrer"
										class="hover:text-gmu-green hover:underline"
										title={snapshot.url}
									>
										{snapshot.url}
									</a>
								{:else}
									<span title={snapshot.url}>{snapshot.url}</span>
								{/if}
								· {formatTime(snapshot.capturedAt)} · {formatSize(snapshot.size)}
							</p>
						</div>
						<div class="flex shrink-0 items-center gap-4">
							<button
								type="button"
								onclick={() => copySnapshot(snapshot.id)}
								class="inline-flex items-center gap-1 text-xs font-medium text-gmu-green hover:underline"
								title="Copy archive link"
							>
								<Icon
									icon={copiedSnapshot === snapshot.id ? 'mdi:check' : 'mdi:content-copy'}
									width="16"
								/>
								{copiedSnapshot === snapshot.id ? 'Copied' : 'Copy link'}
							</button>
							<a
								href={`/snapshot/${snapshot.id}`}
								target="_blank"
								rel="noopener noreferrer"
								class="inline-flex items-center gap-1 text-xs font-medium text-gmu-green hover:underline"
							>
								<Icon icon="mdi:eye-outline" width="16" />
								View
							</a>
							<form
								method="POST"
								action="?/deleteSnapshot"
								use:enhance
								onsubmit={(event) =>
									confirmSubmit(event, {
										title: 'Delete snapshot',
										message: 'Delete this snapshot?',
										danger: true,
										confirmLabel: 'Delete'
									})}
							>
								<input type="hidden" name="id" value={snapshot.id} />
								<button class="flex items-center gap-1 text-xs font-medium text-red-600 hover:underline">
									<Icon icon="mdi:trash-can-outline" width="14" />
									Delete
								</button>
							</form>
						</div>
					</li>
				{/each}
			</ul>
		</div>
	{/if}
{:else}
	<form onsubmit={uploadMedia} class="card mt-6 flex flex-col gap-3 p-4">
		<div class="flex flex-col gap-3 sm:flex-row sm:items-center">
			<input
				bind:this={mediaInput}
				name="file"
				type="file"
				required
				disabled={mediaUploading}
				class="block w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-gmu-green-light file:px-4 file:py-2 file:text-sm file:font-semibold file:text-gmu-green hover:file:bg-gmu-green/20 sm:w-auto"
			/>
			<button class="btn-primary w-full sm:w-auto" disabled={mediaUploading}>
				<Icon
					icon={mediaUploading ? 'mdi:loading' : 'mdi:upload'}
					width="18"
					class={mediaUploading ? 'animate-spin' : ''}
				/>
				{mediaUploading ? 'Uploading...' : 'Upload'}
			</button>
			{#if mediaError}
				<span class="text-sm text-red-600">{mediaError}</span>
			{/if}
		</div>
		{#if mediaUploading || mediaProgress > 0}
			<div class="flex items-center gap-3">
				<div class="h-2 flex-1 overflow-hidden rounded-full bg-slate-200">
					<div
						class="h-full rounded-full bg-gmu-green transition-[width] duration-150"
						style="width: {mediaProgress}%"
					></div>
				</div>
				<span class="w-10 shrink-0 text-right text-xs font-medium text-slate-500">{mediaProgress}%</span>
			</div>
		{/if}
	</form>

	<div class="relative mt-6">
		<Icon
			icon="mdi:magnify"
			width="18"
			class="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-slate-400"
		/>
		<input
			type="search"
			bind:value={search}
			placeholder="Search files by name..."
			class="w-full rounded-lg border border-slate-200 bg-white py-2.5 pr-3 pl-10 text-sm text-slate-700 placeholder:text-slate-400 focus:border-gmu-green focus:ring-1 focus:ring-gmu-green focus:outline-none"
		/>
	</div>

	{#if visible.length === 0}
		<div class="card empty-state mt-6">
			<Icon icon="mdi:image-off-outline" width="32" class="text-slate-300" />
			<p>
				{data.files.length === 0
					? 'No files uploaded yet.'
					: search.trim()
						? `No files match "${search.trim()}".`
						: filter === 'unused'
							? 'No unused files. Everything is referenced somewhere.'
							: 'No files of this type.'}
			</p>
		</div>
	{:else}
		<div class="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
			{#each paged as file (file.id)}
				<div class="card card-hover flex flex-col p-4">
					{#if isImage(file.contentType)}
						<button
							type="button"
							onclick={() => openPreview(file)}
							class="group/preview relative h-32 w-full overflow-hidden rounded-lg border border-slate-200 bg-slate-50"
							title="Click to preview"
						>
							<img
								src={`/api/files/${file.id}`}
								alt={file.filename}
								class="h-full w-full object-contain"
							/>
							<span class="absolute inset-0 flex items-center justify-center bg-slate-900/0 text-white opacity-0 transition group-hover/preview:bg-slate-900/40 group-hover/preview:opacity-100">
								<Icon icon="mdi:magnify-plus-outline" width="24" />
							</span>
						</button>
					{:else if isVideo(file.contentType)}
						<button
							type="button"
							onclick={() => openPreview(file)}
							class="group/preview relative flex h-32 w-full items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-slate-900"
							title="Click to preview"
						>
							<video src={`/api/files/${file.id}`} class="h-full w-full object-contain" muted preload="metadata"></video>
							<span class="absolute inset-0 flex items-center justify-center bg-slate-900/30 text-white transition group-hover/preview:bg-slate-900/50">
								<Icon icon="mdi:play-circle-outline" width="36" />
							</span>
						</button>
					{:else if isPdf(file.contentType)}
						<a
							href={`/api/files/${file.id}`}
							target="_blank"
							rel="noopener noreferrer"
							class="group/pdf relative flex h-32 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-red-400"
							title="Open PDF"
						>
							<Icon icon="mdi:file-pdf-box" width="40" />
							<span class="absolute inset-0 flex items-center justify-center bg-slate-900/0 text-white opacity-0 transition group-hover/pdf:bg-slate-900/40 group-hover/pdf:opacity-100">
								<Icon icon="mdi:open-in-new" width="24" />
							</span>
						</a>
					{:else}
						<a
							href={`/api/files/${file.id}`}
							target="_blank"
							rel="noopener noreferrer"
							download={file.filename}
							class="group/file relative flex h-32 flex-col items-center justify-center gap-1 rounded-lg border border-slate-200 bg-slate-50 text-slate-400"
							title="Download file"
						>
							<Icon icon="mdi:file-outline" width="36" />
							<span class="text-xs font-semibold uppercase">{extensionOf(file.filename)}</span>
							<span class="absolute inset-0 flex items-center justify-center bg-slate-900/0 text-white opacity-0 transition group-hover/file:bg-slate-900/40 group-hover/file:opacity-100">
								<Icon icon="mdi:download" width="24" />
							</span>
						</a>
					{/if}
					<p class="mt-3 truncate text-sm font-medium" title={file.filename}>{file.filename}</p>
					{#if file.used}
						<span
							class="mt-1 inline-flex w-fit items-center gap-1 text-xs font-medium text-gmu-green"
							title="Referenced somewhere in the CMS"
						>
							<Icon icon="mdi:link-variant" width="13" />
							In use
						</span>
					{:else}
						<span
							class="mt-1 inline-flex w-fit items-center gap-1 text-xs text-slate-400"
							title="Not referenced anywhere in the CMS"
						>
							<Icon icon="mdi:link-variant-off" width="13" />
							Unused
						</span>
					{/if}
					<button
						type="button"
						onclick={() => copyPath(file.id)}
						class="mt-1 flex items-center gap-1.5 truncate text-left text-xs text-muted hover:text-gmu-green"
						title="Copy path"
					>
						<Icon icon={copiedId === file.id ? 'mdi:check' : 'mdi:content-copy'} width="14" class="shrink-0" />
						<span class="truncate">{copiedId === file.id ? 'Copied' : `/api/files/${file.id}`}</span>
					</button>
					<form
						method="POST"
						action="?/delete"
						class="mt-3 border-t border-slate-100 pt-3"
						onsubmit={(event) => confirmDelete(event, file)}
					>
						<input type="hidden" name="id" value={file.id} />
						<button class="flex items-center gap-1 text-xs font-medium text-red-600 hover:underline">
							<Icon icon="mdi:trash-can-outline" width="14" />
							Delete
						</button>
					</form>
				</div>
			{/each}
		</div>

		{#if pageCount > 1}
			<div class="mt-6 flex items-center justify-center gap-2">
				<button
					type="button"
					class="btn-secondary"
					disabled={mediaPage === 1}
					onclick={() => (mediaPage = Math.max(1, mediaPage - 1))}
				>
					<Icon icon="mdi:chevron-left" width="18" />
					Previous
				</button>
				<span class="px-2 text-sm text-muted">Page {mediaPage} of {pageCount}</span>
				<button
					type="button"
					class="btn-secondary"
					disabled={mediaPage === pageCount}
					onclick={() => (mediaPage = Math.min(pageCount, mediaPage + 1))}
				>
					Next
					<Icon icon="mdi:chevron-right" width="18" />
				</button>
			</div>
		{/if}
	{/if}
{/if}

{#if preview}
	<div
		class="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-900/80 p-4 backdrop-blur-sm"
		role="button"
		tabindex="-1"
		onclick={closePreview}
		onkeydown={(event) => {
			if (event.key === 'Enter' || event.key === ' ') closePreview();
		}}
	>
		<button
			type="button"
			onclick={closePreview}
			class="absolute top-4 right-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
			aria-label="Close preview"
		>
			<Icon icon="mdi:close" width="24" />
		</button>
		{#if isVideo(preview.contentType)}
			<!-- svelte-ignore a11y_no_static_element_interactions -->
			<!-- svelte-ignore a11y_click_events_have_key_events -->
			<!-- svelte-ignore a11y_media_has_caption -->
			<video
				src={`/api/files/${preview.id}`}
				controls
				autoplay
				class="max-h-[85vh] max-w-[90vw] rounded-lg shadow-2xl"
				onclick={(event) => event.stopPropagation()}
			></video>
		{:else}
			<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
			<!-- svelte-ignore a11y_click_events_have_key_events -->
			<img
				src={`/api/files/${preview.id}`}
				alt={preview.filename}
				class="max-h-[85vh] max-w-[90vw] rounded-lg object-contain shadow-2xl"
				onclick={(event) => event.stopPropagation()}
			/>
		{/if}
		<p class="mt-4 max-w-[90vw] truncate text-center text-sm text-white/80" title={preview.filename}>
			{preview.filename}
		</p>
	</div>
{/if}
