<script lang="ts">
	import { onMount } from 'svelte';

	let {
		container,
		fieldKey,
		placeholder = ''
	}: { container: Record<string, any>; fieldKey: string; placeholder?: string } = $props();

	let names = $state<string[]>([]);
	let loading = $state(true);
	let open = $state(false);

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

	const value = $derived(String(container[fieldKey] ?? ''));

	const matches = $derived.by(() => {
		const text = value.trim().toLowerCase();
		return names
			.filter((name) => !text || (name.toLowerCase().includes(text) && name.toLowerCase() !== text))
			.slice(0, 8);
	});

	function choose(name: string) {
		container[fieldKey] = name;
		open = false;
	}
</script>

<div class="relative">
	<input
		class="field-input"
		type="text"
		placeholder={loading ? 'Loading team...' : placeholder || 'Type an author name'}
		{value}
		oninput={(event) => {
			container[fieldKey] = event.currentTarget.value;
			open = true;
		}}
		onfocus={() => (open = true)}
		onblur={() => (open = false)}
		autocomplete="off"
	/>
	{#if open && matches.length > 0}
		<ul
			class="absolute z-10 mt-1 max-h-64 w-full divide-y divide-slate-100 overflow-auto rounded-lg border border-slate-200 bg-white shadow-lg"
		>
			{#each matches as name (name)}
				<li>
					<button
						type="button"
						class="flex w-full items-center px-3 py-2 text-left text-sm hover:bg-slate-50"
						onmousedown={() => choose(name)}
					>
						{name}
					</button>
				</li>
			{/each}
		</ul>
	{/if}
</div>
