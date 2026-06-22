<script lang="ts">
	import Icon from '@iconify/svelte';
	import FieldEditor from './FieldEditor.svelte';
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

	let doc = $state(ensureShape(structuredClone(initial), fields));

	const serialized = $derived(JSON.stringify(doc));
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
		<a href={`/admin/${metaKey}`} class="btn-secondary">Cancel</a>
	</div>
</form>
