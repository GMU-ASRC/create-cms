<script lang="ts">
	import Icon from '@iconify/svelte';
	import { enhance } from '$app/forms';
	import { iconFor, tintFor } from '$lib/ui';
	import { displayFor } from '$lib/display';

	let { data } = $props();

	const meta = $derived(data.meta);
	const display = $derived(displayFor(meta.key));

	const pageSize = 7;
	let page = $state(1);
	let search = $state('');

	const matched = $derived(
		data.documents.filter((doc) => {
			const term = search.trim().toLowerCase();
			if (!term) return true;
			return String(doc[meta.titleField] ?? '')
				.toLowerCase()
				.includes(term);
		})
	);

	const totalPages = $derived(Math.max(1, Math.ceil(matched.length / pageSize)));
	const visible = $derived(matched.slice((page - 1) * pageSize, page * pageSize));

	const dragEnabled = $derived(search.trim() === '');

	let dragList = $state<Array<Record<string, any>>>([]);
	let dragIndex = $state<number | null>(null);
	let reorderForm = $state<HTMLFormElement | null>(null);

	const rows = $derived(dragEnabled ? dragList : visible);
	const orderIds = $derived(dragList.map((doc) => doc.id).join(','));

	$effect(() => {
		dragList = [...data.documents];
	});

	$effect(() => {
		search;
		page = 1;
	});

	function onDragStart(index: number) {
		dragIndex = index;
	}

	function onDragOver(event: DragEvent, index: number) {
		event.preventDefault();
		if (dragIndex === null || dragIndex === index) return;
		const list = [...dragList];
		const [moved] = list.splice(dragIndex, 1);
		list.splice(index, 0, moved);
		dragList = list;
		dragIndex = index;
	}

	function onDrop() {
		dragIndex = null;
		reorderForm?.requestSubmit();
	}

	function title(doc: Record<string, unknown>): string {
		const value = doc[meta.titleField];
		return value ? String(value) : '(untitled)';
	}

	function thumb(doc: Record<string, any>): string {
		return display.image ? doc[display.image] : '';
	}

	function go(target: number) {
		page = Math.min(totalPages, Math.max(1, target));
	}
</script>

<svelte:head><title>Sponsors | CREATE CMS</title></svelte:head>

<div class="flex items-center justify-between gap-4">
	<div class="flex items-center gap-3">
		<span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg {tintFor(meta.key)}">
			<Icon icon={iconFor(meta.key)} width="22" />
		</span>
		<div>
			<h1 class="page-title">{meta.label}</h1>
			<p class="text-sm text-muted">
				{#if matched.length !== data.documents.length}
					{matched.length} of {data.documents.length} entries
				{:else}
					{data.documents.length}
					{data.documents.length === 1 ? 'entry' : 'entries'}
				{/if}
			</p>
		</div>
	</div>
	<a href={`/admin/${meta.key}/new`} class="btn-primary">
		<Icon icon="mdi:plus" width="18" />
		New
	</a>
</div>

{#if data.documents.length > 0}
	<div class="mt-6 space-y-3">
		<div class="relative">
			<Icon
				icon="mdi:magnify"
				width="20"
				class="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-slate-400"
			/>
			<input
				type="search"
				placeholder={`Search ${meta.label.toLowerCase()}...`}
				bind:value={search}
				class="field-input pl-10"
			/>
		</div>
		<p class="flex items-center gap-1.5 text-xs text-muted">
			<Icon icon="mdi:drag-vertical" width="14" />
			{dragEnabled ? 'Drag rows to reorder. Changes save automatically.' : 'Clear the search to reorder by dragging.'}
		</p>
	</div>
{/if}

{#if dragEnabled}
	<form bind:this={reorderForm} method="POST" action="?/reorder" class="hidden" use:enhance>
		<input type="hidden" name="ids" value={orderIds} />
	</form>
{/if}

<div class="card mt-6 overflow-hidden">
	{#if data.documents.length === 0}
		<div class="empty-state">
			<Icon icon="mdi:tray-remove" width="32" class="text-slate-300" />
			<p>No entries yet.</p>
			<a href={`/admin/${meta.key}/new`} class="btn-primary mt-2">
				<Icon icon="mdi:plus" width="18" />
				Create the first one
			</a>
		</div>
	{:else if matched.length === 0}
		<div class="empty-state">
			<Icon icon="mdi:magnify-close" width="32" class="text-slate-300" />
			<p>No matching entries.</p>
		</div>
	{:else}
		<ul class="divide-y divide-slate-100">
			{#each rows as doc, index (doc.id)}
				{@const image = thumb(doc)}
				<li
					draggable={dragEnabled ? 'true' : 'false'}
					ondragstart={() => onDragStart(index)}
					ondragover={(event) => onDragOver(event, index)}
					ondrop={onDrop}
					ondragend={() => (dragIndex = null)}
					class={dragEnabled && dragIndex === index ? 'bg-gmu-green-light/50' : ''}
				>
					<a
						href={`/admin/${meta.key}/${doc.id}`}
						draggable="false"
						class="group flex items-center gap-4 px-4 py-3 hover:bg-slate-50 sm:px-5"
					>
						{#if dragEnabled}
							<Icon
								icon="mdi:drag-vertical"
								width="20"
								class="shrink-0 cursor-grab text-slate-300 group-hover:text-slate-400"
							/>
						{/if}
						{#if image}
							<img
								src={image}
								alt=""
								class="h-12 w-12 shrink-0 rounded-lg border border-slate-200 bg-slate-50 object-cover"
							/>
						{:else}
							<span class="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-dashed border-slate-200 text-slate-300">
								<Icon icon="mdi:image-outline" width="20" />
							</span>
						{/if}

						<div class="min-w-0 flex-1">
							<p class="truncate font-medium text-slate-900">{title(doc)}</p>
						</div>

						<Icon
							icon="mdi:pencil-outline"
							width="18"
							class="shrink-0 text-slate-300 transition-colors group-hover:text-gmu-green"
						/>
					</a>
				</li>
			{/each}
		</ul>
		{#if totalPages > 1 && !dragEnabled}
			<div class="flex items-center justify-between gap-2 border-t border-slate-100 px-4 py-3 sm:px-5">
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
</div>
