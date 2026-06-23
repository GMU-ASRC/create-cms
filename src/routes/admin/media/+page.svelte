<script lang="ts">
	import Icon from '@iconify/svelte';
	import { enhance } from '$app/forms';

	let { data, form } = $props();

	let copiedId = $state('');
	let copiedLink = $state('');
	let copiedSnapshot = $state('');
	let capturing = $state(false);
	let filter = $state<'all' | 'image' | 'pdf' | 'links' | 'snapshots'>('all');

	const filters = [
		{ key: 'all', label: 'All' },
		{ key: 'image', label: 'Images' },
		{ key: 'pdf', label: 'PDFs' },
		{ key: 'links', label: 'Links' },
		{ key: 'snapshots', label: 'Snapshots' }
	] as const;

	function kind(contentType: string | undefined): 'image' | 'pdf' | 'other' {
		if (contentType?.startsWith('image/')) return 'image';
		if (contentType === 'application/pdf') return 'pdf';
		return 'other';
	}

	const rank: Record<string, number> = { image: 0, pdf: 1, other: 2 };
	const sorted = $derived(
		[...data.files].sort((a, b) => rank[kind(a.contentType)] - rank[kind(b.contentType)])
	);
	const visible = $derived(
		filter === 'image' || filter === 'pdf'
			? sorted.filter((file) => kind(file.contentType) === filter)
			: sorted
	);

	function countFor(key: 'all' | 'image' | 'pdf' | 'links' | 'snapshots'): number {
		if (key === 'links') return data.links.length;
		if (key === 'snapshots') return data.snapshots.length;
		if (key === 'all') return data.files.length;
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

	function isPdf(contentType: string | undefined): boolean {
		return contentType === 'application/pdf';
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
		if (!confirm(message)) {
			event.preventDefault();
		}
	}
</script>

<svelte:head><title>Media | CREATE CMS</title></svelte:head>

<h1 class="page-title">Media</h1>
<p class="page-subtitle">
	Upload images and PDFs, create short redirect links, or archive a snapshot of a web page.
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
								<a
									href={snapshot.url}
									target="_blank"
									rel="noopener noreferrer"
									class="hover:text-gmu-green hover:underline"
									title={snapshot.url}
								>
									{snapshot.url}
								</a>
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
								onsubmit={(event) => {
									if (!confirm('Delete this snapshot?')) event.preventDefault();
								}}
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
	<form
		method="POST"
		action="?/upload"
		enctype="multipart/form-data"
		class="card mt-6 flex flex-col gap-3 p-4 sm:flex-row sm:items-center"
	>
		<input
			name="file"
			type="file"
			accept="image/*,application/pdf"
			required
			class="block w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-gmu-green-light file:px-4 file:py-2 file:text-sm file:font-semibold file:text-gmu-green hover:file:bg-gmu-green/20 sm:w-auto"
		/>
		<button class="btn-primary w-full sm:w-auto">
			<Icon icon="mdi:upload" width="18" />
			Upload
		</button>
		{#if form?.error}
			<span class="text-sm text-red-600">{form.error}</span>
		{/if}
	</form>

	{#if visible.length === 0}
		<div class="card empty-state mt-6">
			<Icon icon="mdi:image-off-outline" width="32" class="text-slate-300" />
			<p>{data.files.length === 0 ? 'No files uploaded yet.' : 'No files of this type.'}</p>
		</div>
	{:else}
		<div class="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
			{#each visible as file (file.id)}
				<div class="card card-hover flex flex-col p-4">
					{#if isImage(file.contentType)}
						<img
							src={`/api/files/${file.id}`}
							alt={file.filename}
							class="h-32 w-full rounded-lg border border-slate-200 bg-slate-50 object-contain"
						/>
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
						<div class="flex h-32 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-300">
							<Icon icon="mdi:file-outline" width="36" />
						</div>
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
	{/if}
{/if}
