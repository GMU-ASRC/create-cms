<script lang="ts">
	import Icon from '@iconify/svelte';
	import { onMount } from 'svelte';
	import { withTags, type RawPublication, type TaggedPublication } from '$lib/publications';

	let { container, fieldKey }: { container: Record<string, any>; fieldKey: string } = $props();

	let publications = $state<TaggedPublication[]>([]);
	let query = $state('');
	let loading = $state(true);

	onMount(async () => {
		try {
			const response = await fetch('/api/content/publications');
			if (response.ok) {
				const raw = (await response.json()) as RawPublication[];
				publications = withTags(Array.isArray(raw) ? raw : []);
			}
		} finally {
			loading = false;
		}
	});

	const byId = $derived(new Map(publications.map((publication) => [publication.id, publication])));

	const selected = $derived(
		((container[fieldKey] ?? []) as string[])
			.map((id) => byId.get(id))
			.filter((publication): publication is TaggedPublication => Boolean(publication))
	);

	const matches = $derived.by(() => {
		const text = query.trim().toLowerCase();
		const chosen = new Set((container[fieldKey] ?? []) as string[]);
		return publications
			.filter((publication) => !chosen.has(publication.id))
			.filter((publication) => {
				if (!text) return true;
				return (
					publication.title.toLowerCase().includes(text) ||
					publication.authors.toLowerCase().includes(text) ||
					publication.tag.toLowerCase().includes(text)
				);
			})
			.slice(0, 8);
	});

	function add(id: string) {
		container[fieldKey] = [...((container[fieldKey] ?? []) as string[]), id];
		query = '';
	}

	function remove(id: string) {
		container[fieldKey] = ((container[fieldKey] ?? []) as string[]).filter((value) => value !== id);
	}
</script>

<div class="space-y-3">
	{#if selected.length > 0}
		<div class="flex flex-wrap gap-2">
			{#each selected as publication (publication.id)}
				<span class="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-slate-50 py-1 pr-1 pl-3 text-sm">
					<span class="font-mono text-xs text-slate-500">{publication.tag}</span>
					<span class="max-w-60 truncate text-slate-700">{publication.title}</span>
					<button
						type="button"
						class="rounded-full p-0.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
						aria-label="Remove"
						onclick={() => remove(publication.id)}
					>
						<Icon icon="mdi:close" width="14" />
					</button>
				</span>
			{/each}
		</div>
	{/if}

	<div>
		<input
			class="field-input"
			type="text"
			placeholder={loading ? 'Loading publications...' : 'Search publications by title, author, or tag'}
			bind:value={query}
			disabled={loading}
		/>
		{#if query.trim() && matches.length > 0}
			<ul class="mt-1 max-h-64 divide-y divide-slate-100 overflow-auto rounded-lg border border-slate-200 bg-white">
				{#each matches as publication (publication.id)}
					<li>
						<button
							type="button"
							class="flex w-full items-start gap-2 px-3 py-2 text-left text-sm hover:bg-slate-50"
							onclick={() => add(publication.id)}
						>
							<span class="mt-0.5 font-mono text-xs text-slate-500">{publication.tag}</span>
							<span class="min-w-0">
								<span class="block truncate font-medium text-slate-900">{publication.title}</span>
								<span class="block truncate text-xs text-muted">{publication.authors}</span>
							</span>
						</button>
					</li>
				{/each}
			</ul>
		{:else if query.trim() && !loading}
			<p class="mt-1 text-xs text-muted">No matching publications.</p>
		{/if}
	</div>
</div>
