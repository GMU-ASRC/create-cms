<script lang="ts">
	import { schemaFor } from '$lib/schema';
	import DocumentForm from '$lib/components/DocumentForm.svelte';

	let { data, form } = $props();

	const meta = $derived(data.meta);
</script>

{#key data.doc}
	<DocumentForm
		fields={schemaFor(meta.key)}
		initial={(data.doc ?? {}) as Record<string, unknown>}
		metaKey={meta.key}
		error={form?.error}
	/>
{/key}
