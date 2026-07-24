<script lang="ts">
	import Icon from '@iconify/svelte';
	import DocumentForm from '$lib/components/DocumentForm.svelte';
	import { schemaFor } from '$lib/schema';
	import { confirmSubmit } from '$lib/confirm';

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
	<DocumentForm {fields} initial={data.doc as Record<string, unknown>} metaKey={meta.key} error={form?.error} />
{/key}

{#if !isNew}
	<div class="mt-8 flex items-center gap-3 border-t border-slate-200 pt-6">
		{#if meta.key === 'events'}
			<form method="POST" action="?/duplicate">
				<button class="btn-secondary">
					<Icon icon="mdi:content-copy" width="18" />
					Duplicate
				</button>
			</form>
		{/if}
		<form
			method="POST"
			action="?/delete"
			onsubmit={(event) =>
				confirmSubmit(event, {
					title: 'Delete entry',
					message: 'Delete this entry? This cannot be undone.',
					danger: true,
					confirmLabel: 'Delete'
				})}
		>
			<button class="btn-danger">
				<Icon icon="mdi:trash-can-outline" width="18" />
				Delete
			</button>
		</form>
	</div>
{/if}
