<script lang="ts">
	import Icon from '@iconify/svelte';
	import DocumentForm from '$lib/components/DocumentForm.svelte';
	import { schemaFor } from '$lib/schema';

	let { data, form } = $props();

	const meta = $derived(data.meta);
	const isNew = $derived(data.isNew);
	const fields = $derived(schemaFor(meta.key));
</script>

<svelte:head><title>{isNew ? 'New' : 'Edit'} {meta.label} | CREATE CMS</title></svelte:head>

<a
	href={`/admin/${meta.key}`}
	class="inline-flex items-center gap-1 text-sm font-medium text-muted hover:text-gmu-green"
>
	<Icon icon="mdi:arrow-left" width="16" />
	{meta.label}
</a>
<h1 class="page-title mt-2">{isNew ? `New ${meta.label}` : `Edit ${meta.label}`}</h1>

{#key data.doc}
	<DocumentForm {fields} initial={data.doc} metaKey={meta.key} error={form?.error} />
{/key}

{#if !isNew}
	<form
		method="POST"
		action="?/delete"
		class="mt-8 border-t border-slate-200 pt-6"
		onsubmit={(event) => {
			if (!confirm('Delete this entry?')) event.preventDefault();
		}}
	>
		<button class="btn-danger">
			<Icon icon="mdi:trash-can-outline" width="18" />
			Delete
		</button>
	</form>
{/if}
