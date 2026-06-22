<script lang="ts">
	import Icon from '@iconify/svelte';
	import { onMount } from 'svelte';

	let { container, fieldKey }: { container: Record<string, any>; fieldKey: string } = $props();

	let names = $state<string[]>([]);
	let query = $state('');
	let loading = $state(true);

	onMount(async () => {
		try {
			const response = await fetch('/api/content/team');
			if (response.ok) {
				const raw = (await response.json()) as Array<{ name?: string }>;
				names = (Array.isArray(raw) ? raw : [])
					.map((entry) => String(entry.name ?? '').trim())
					.filter(Boolean);
			}
		} finally {
			loading = false;
		}
	});

	const selected = $derived((container[fieldKey] ?? []) as string[]);

	const matches = $derived.by(() => {
		const text = query.trim().toLowerCase();
		const chosen = new Set(selected);
		return names
			.filter((name) => !chosen.has(name))
			.filter((name) => !text || name.toLowerCase().includes(text))
			.slice(0, 8);
	});

	function add(name: string) {
		const value = name.trim();
		if (value && !selected.includes(value)) {
			container[fieldKey] = [...selected, value];
		}
		query = '';
	}

	function remove(name: string) {
		container[fieldKey] = selected.filter((value) => value !== name);
	}

	function onKeydown(event: KeyboardEvent) {
		if (event.key !== 'Enter') return;
		event.preventDefault();
		if (matches.length > 0) add(matches[0]);
		else if (query.trim()) add(query);
	}
</script>

<div class="space-y-3">
	{#if selected.length > 0}
		<div class="flex flex-wrap gap-2">
			{#each selected as name (name)}
				<span class="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-slate-50 py-1 pr-1 pl-3 text-sm">
					<span class="text-slate-700">{name}</span>
					<button
						type="button"
						class="rounded-full p-0.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
						aria-label="Remove"
						onclick={() => remove(name)}
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
			placeholder={loading ? 'Loading team...' : 'Search team members, or type a name and press Enter'}
			bind:value={query}
			onkeydown={onKeydown}
			disabled={loading}
		/>
		{#if query.trim() && matches.length > 0}
			<ul class="mt-1 max-h-64 divide-y divide-slate-100 overflow-auto rounded-lg border border-slate-200 bg-white">
				{#each matches as name (name)}
					<li>
						<button
							type="button"
							class="flex w-full items-center px-3 py-2 text-left text-sm hover:bg-slate-50"
							onclick={() => add(name)}
						>
							{name}
						</button>
					</li>
				{/each}
			</ul>
		{/if}
	</div>
</div>
