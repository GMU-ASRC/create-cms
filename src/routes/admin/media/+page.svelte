<script lang="ts">
	import Icon from '@iconify/svelte';

	let { data, form } = $props();

	let copiedId = $state('');
	let filter = $state<'all' | 'image' | 'pdf'>('all');

	const filters = [
		{ key: 'all', label: 'All' },
		{ key: 'image', label: 'Images' },
		{ key: 'pdf', label: 'PDFs' }
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
		filter === 'all' ? sorted : sorted.filter((file) => kind(file.contentType) === filter)
	);

	function countFor(key: 'all' | 'image' | 'pdf'): number {
		if (key === 'all') return data.files.length;
		return data.files.filter((file) => kind(file.contentType) === key).length;
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
</script>

<svelte:head><title>Media | CREATE CMS</title></svelte:head>

<h1 class="page-title">Media</h1>
<p class="page-subtitle">
	Upload images and PDFs. Reference them in content using the path shown on each item.
</p>

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

{#if data.files.length === 0}
	<div class="card empty-state mt-6">
		<Icon icon="mdi:image-off-outline" width="32" class="text-slate-300" />
		<p>No files uploaded yet.</p>
	</div>
{:else}
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

	{#if visible.length === 0}
		<div class="card empty-state mt-6">
			<Icon icon="mdi:image-off-outline" width="32" class="text-slate-300" />
			<p>No files of this type.</p>
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
				<button
					type="button"
					onclick={() => copyPath(file.id)}
					class="mt-1 flex items-center gap-1.5 truncate text-left text-xs text-muted hover:text-gmu-green"
					title="Copy path"
				>
					<Icon icon={copiedId === file.id ? 'mdi:check' : 'mdi:content-copy'} width="14" class="shrink-0" />
					<span class="truncate">{copiedId === file.id ? 'Copied' : `/api/files/${file.id}`}</span>
				</button>
				<form method="POST" action="?/delete" class="mt-3 border-t border-slate-100 pt-3">
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
