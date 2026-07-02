<script lang="ts">
	import Icon from '@iconify/svelte';
	import { confirmSubmit } from '$lib/confirm';

	let { data, form } = $props();

	const pageSize = 10;
	let page = $state(1);
	const totalPages = $derived(Math.max(1, Math.ceil(data.entries.length / pageSize)));
	const visible = $derived(data.entries.slice((page - 1) * pageSize, page * pageSize));

	function go(target: number) {
		page = Math.min(totalPages, Math.max(1, target));
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
</script>

<div class="flex items-center justify-between gap-3">
	<p class="text-sm text-muted">
		{data.entries.length}
		{data.entries.length === 1 ? 'event' : 'events'} (most recent first)
	</p>
	{#if data.isOwner && data.entries.length > 0}
		<form
			method="POST"
			action="?/clear"
			onsubmit={(event) =>
				confirmSubmit(event, {
					title: 'Clear activity log',
					message: 'Clear the entire activity log? This cannot be undone.',
					danger: true,
					confirmLabel: 'Clear log'
				})}
		>
			<button class="flex items-center gap-1 text-xs font-medium text-red-600 hover:underline">
				<Icon icon="mdi:trash-can-outline" width="16" />
				Clear log
			</button>
		</form>
	{/if}
</div>

{#if form?.error}
	<p class="alert-error mt-3">{form.error}</p>
{/if}

<div class="card mt-4 overflow-hidden">
	{#if data.entries.length === 0}
		<div class="empty-state">
			<Icon icon="mdi:history" width="32" class="text-slate-300" />
			<p>No activity recorded yet.</p>
		</div>
	{:else}
		<ul class="divide-y divide-slate-100">
			{#each visible as entry (entry.id)}
				<li class="flex items-start gap-3 px-5 py-3">
					<Icon icon="mdi:circle-small" width="20" class="mt-0.5 shrink-0 text-gmu-green" />
					<div class="min-w-0 flex-1">
						<p class="text-sm text-slate-800">
							<span class="font-medium">{entry.action}</span>
							{#if entry.detail}<span class="text-slate-500"> — {entry.detail}</span>{/if}
						</p>
						<p class="mt-0.5 text-xs text-muted">
							{entry.user || 'unknown'} · {formatTime(entry.at)}
						</p>
					</div>
				</li>
			{/each}
		</ul>
		{#if totalPages > 1}
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
