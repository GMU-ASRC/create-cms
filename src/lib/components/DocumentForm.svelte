<script lang="ts">
	import { untrack } from 'svelte';
	import Icon from '@iconify/svelte';
	import FieldEditor from './FieldEditor.svelte';
	import EntryPreview from './EntryPreview.svelte';
	import { ensureShape, type Field } from '$lib/schema';

	let {
		fields,
		initial,
		metaKey,
		error
	}: {
		fields: Field[];
		initial: Record<string, unknown>;
		metaKey: string;
		error?: string;
	} = $props();

	let doc = $state(untrack(() => ensureShape(structuredClone(initial), fields)));

	const serialized = $derived(JSON.stringify(doc));

	const previewable = ['news', 'events', 'projects', 'researchArticles'];
	const canPreview = $derived(previewable.includes(metaKey));
	let showPreview = $state(false);
</script>

<form method="POST" action="?/save" class="mt-6">
	<p class="mb-4 text-xs text-muted">
		Fields marked <span class="text-red-600">*</span> are required. All others are optional.
	</p>
	<div class="space-y-6">
		{#each fields as field (field.key)}
			<FieldEditor {field} container={doc} />
		{/each}
	</div>

	<input type="hidden" name="json" value={serialized} />

	{#if error}
		<p class="alert-error mt-4">{error}</p>
	{/if}

	<div class="mt-6 flex flex-wrap items-center gap-3">
		<button class="btn-primary">
			<Icon icon="mdi:content-save-outline" width="18" />
			Save
		</button>
		{#if canPreview}
			<button type="button" class="btn-secondary" onclick={() => (showPreview = true)}>
				<Icon icon="mdi:eye-outline" width="18" />
				Preview
			</button>
		{/if}
		<a href={`/admin/${metaKey}`} class="btn-secondary">Cancel</a>
	</div>
</form>

{#if showPreview && canPreview}
	<div class="fixed inset-0 z-50 flex flex-col bg-slate-900/60">
		<div class="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3">
			<div class="flex items-center gap-2 text-sm font-semibold text-slate-700">
				<Icon icon="mdi:eye-outline" width="18" class="text-gmu-green" />
				Preview
				<span class="font-normal text-muted">Not yet saved</span>
			</div>
			<button
				type="button"
				class="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100"
				aria-label="Close preview"
				onclick={() => (showPreview = false)}
			>
				<Icon icon="mdi:close" width="22" />
			</button>
		</div>
		<div class="flex-1 overflow-y-auto bg-white">
			<EntryPreview {metaKey} {doc} />
		</div>
	</div>
{/if}
