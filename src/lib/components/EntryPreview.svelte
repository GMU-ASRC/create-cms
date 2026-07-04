<script lang="ts">
	import Icon from '@iconify/svelte';

	let { metaKey, doc }: { metaKey: string; doc: Record<string, any> } = $props();

	const videoExtensions = /\.(mp4|webm|ogg|ogv|mov|m4v)$/i;

	function formatDate(value: unknown): string {
		if (typeof value !== 'string' || !value) return '';
		const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
		return match ? `${match[2]}/${match[3]}/${match[1]}` : value;
	}

	function dayNumber(value: unknown): number | null {
		if (typeof value !== 'string') return null;
		const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value.trim());
		if (!match) return null;
		return Number(match[1]) * 10000 + Number(match[2]) * 100 + Number(match[3]);
	}

	function eventRange(entry: Record<string, any>): string {
		const start = formatDate(entry.date);
		const end = formatDate(entry.endDate);
		if (!start) return '';
		return end && end !== start ? `${start} - ${end}` : start;
	}

	function eventStatus(entry: Record<string, any>): string {
		const start = dayNumber(entry.date);
		if (start === null) return 'Upcoming';
		const end = dayNumber(entry.endDate) ?? start;
		const now = new Date();
		const today = now.getFullYear() * 10000 + (now.getMonth() + 1) * 100 + now.getDate();
		if (today < start) return 'Upcoming';
		if (today > end) return 'Past';
		return 'Ongoing';
	}

	function statusClass(status: string): string {
		if (status === 'Ongoing') return 'bg-gmu-gold text-gmu-green-dark';
		if (status === 'Upcoming') return 'bg-gmu-green-light text-gmu-green';
		return 'bg-slate-100 text-slate-500';
	}

	function isVideo(path: string): boolean {
		return videoExtensions.test(path);
	}

	function hasHtml(value: unknown): boolean {
		return typeof value === 'string' && value.replace(/<[^>]*>/g, '').trim().length > 0;
	}

	const tags = $derived((doc.tags ?? []) as string[]);
	const members = $derived((doc.teamMembers ?? []) as string[]);
	const funding = $derived((doc.funding ?? []) as string[]);
	const links = $derived((doc.links ?? []) as Array<{ label?: string; href?: string }>);
	const gallery = $derived((doc.gallery ?? []) as string[]);
	const files = $derived((doc.files ?? []) as Array<{ name?: string; path?: string }>);
	const status = $derived(eventStatus(doc));
</script>

{#snippet tagList(items: string[])}
	{#if items.length}
		<div class="mt-4 flex flex-wrap gap-2">
			{#each items as tag, index (index)}
				<span class="rounded-full bg-gmu-green-light px-3 py-1 text-xs font-medium text-gmu-green">{tag}</span>
			{/each}
		</div>
	{/if}
{/snippet}

{#snippet memberList(items: string[])}
	{#if items.length}
		<div class="mt-6">
			<h3 class="text-sm font-semibold tracking-widest text-gmu-green uppercase">Team</h3>
			<div class="mt-2 flex flex-wrap gap-2">
				{#each items as name (name)}
					<span class="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-3 py-1 text-sm text-slate-700">
						<Icon icon="mdi:account" width="14" class="text-gmu-green" />
						{name}
					</span>
				{/each}
			</div>
		</div>
	{/if}
{/snippet}

{#snippet linkList(items: Array<{ label?: string; href?: string }>)}
	{#if items.some((item) => item.href || item.label)}
		<div class="mt-6 flex flex-wrap gap-3">
			{#each items as item, index (index)}
				{#if item.href || item.label}
					<span class="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-gmu-green">
						<Icon icon="mdi:link-variant" width="16" />
						{item.label || item.href}
					</span>
				{/if}
			{/each}
		</div>
	{/if}
{/snippet}

{#snippet fundingList(items: string[])}
	{#if items.length}
		<div class="mt-6">
			<h3 class="text-sm font-semibold tracking-widest text-gmu-green uppercase">Funding</h3>
			<ul class="mt-2 list-inside list-disc text-sm text-slate-600">
				{#each items as source, index (index)}
					<li>{source}</li>
				{/each}
			</ul>
		</div>
	{/if}
{/snippet}

{#snippet galleryGrid(items: string[])}
	{#if items.length}
		<div class="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
			{#each items as src, index (index)}
				<div class="aspect-square overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
					{#if isVideo(src)}
						<!-- svelte-ignore a11y_media_has_caption -->
						<video src={src} muted preload="metadata" class="h-full w-full bg-slate-900 object-cover"></video>
					{:else}
						<img src={src} alt="" class="h-full w-full object-cover" />
					{/if}
				</div>
			{/each}
		</div>
	{/if}
{/snippet}

{#snippet fileList(items: Array<{ name?: string; path?: string }>)}
	{#if items.length}
		<div class="mt-6">
			<h3 class="text-sm font-semibold tracking-widest text-gmu-green uppercase">Files</h3>
			<ul class="mt-2 space-y-2">
				{#each items as file, index (index)}
					<li class="inline-flex items-center gap-2 text-sm font-medium text-gmu-green">
						<Icon icon="mdi:file-document-outline" width="18" />
						{file.name || file.path}
					</li>
				{/each}
			</ul>
		</div>
	{/if}
{/snippet}

<div class="mx-auto max-w-3xl px-6 py-10 text-slate-900">
	{#if metaKey === 'news'}
		<article>
			<p class="font-mono text-xs font-semibold text-gmu-green">{formatDate(doc.date) || 'No date'}</p>
			<h1 class="mt-2 text-3xl font-bold tracking-tight">{doc.title || 'Untitled'}</h1>
			{#if doc.author}<p class="mt-1 text-sm font-medium text-slate-500">By {doc.author}</p>{/if}
			<div class="mt-3 h-1 w-12 bg-gmu-gold"></div>
			{#if hasHtml(doc.body)}
				<div class="rich-content mt-6">{@html doc.body}</div>
			{:else}
				<p class="mt-6 text-sm text-slate-400">No body content yet.</p>
			{/if}
			{#if doc.linkType === 'external' && doc.href}
				<p class="mt-6 inline-flex items-center gap-1 text-sm font-medium text-gmu-green">
					Read more
					<Icon icon="mdi:open-in-new" width="16" />
				</p>
			{/if}
			{@render galleryGrid(gallery)}
			{@render fileList(files)}
		</article>
	{:else if metaKey === 'events'}
		<article>
			<div class="flex flex-wrap items-center gap-3">
				<span class="font-mono text-sm text-gmu-green">{eventRange(doc) || 'No date'}</span>
				<span class="rounded-full px-2 py-0.5 text-xs font-medium {statusClass(status)}">{status}</span>
				{#if doc.linkType === 'external'}
					<span class="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">External link</span>
				{/if}
			</div>
			<h1 class="mt-3 text-3xl font-bold tracking-tight">{doc.title || 'Untitled'}</h1>
			{#if doc.location}
				<p class="mt-1 inline-flex items-center gap-1 text-sm text-slate-500">
					<Icon icon="mdi:map-marker-outline" width="15" />
					{doc.location}
				</p>
			{/if}
			<div class="mt-3 h-1 w-12 bg-gmu-gold"></div>
			{#if hasHtml(doc.summary)}
				<div class="rich-content mt-5 text-lg">{@html doc.summary}</div>
			{/if}
			{#if doc.image}
				<img src={String(doc.image)} alt="" class="mt-6 max-h-[28rem] w-full rounded-lg border border-slate-200 bg-slate-50 object-contain" />
			{/if}
			{#if doc.linkType === 'external'}
				<p class="mt-6 text-sm text-slate-400">External events link to {doc.href || 'a URL you provide'} instead of a page.</p>
			{:else}
				{#if hasHtml(doc.content)}
					<div class="rich-content mt-6">{@html doc.content}</div>
				{/if}
				{@render tagList(tags)}
				{@render memberList(members)}
				{@render linkList(links)}
				{@render galleryGrid(gallery)}
				{@render fileList(files)}
			{/if}
		</article>
	{:else if metaKey === 'projects'}
		<article>
			<div class="flex flex-wrap items-center gap-3">
				{#if doc.status}<span class="font-mono text-xs text-gmu-green">{doc.status}</span>{/if}
				{#if doc.featured}
					<span class="inline-flex items-center gap-1 rounded-full bg-gmu-gold px-2.5 py-1 text-xs font-bold text-gmu-green-dark">
						<Icon icon="mdi:star" width="13" />
						Featured
					</span>
				{/if}
			</div>
			<h1 class="mt-2 text-3xl font-bold tracking-tight">{doc.title || 'Untitled'}</h1>
			<div class="mt-3 h-1 w-12 bg-gmu-gold"></div>
			{#if hasHtml(doc.summary)}
				<div class="rich-content mt-5 text-lg">{@html doc.summary}</div>
			{/if}
			{#if doc.image}
				<img src={String(doc.image)} alt="" class="mt-6 max-h-[28rem] w-full rounded-lg border border-slate-200 bg-slate-50 object-contain" />
			{/if}
			{#if hasHtml(doc.content)}
				<div class="rich-content mt-6">{@html doc.content}</div>
			{/if}
			{@render tagList(tags)}
			{@render memberList(members)}
			{@render fundingList(funding)}
			{@render linkList(links)}
			{@render galleryGrid(gallery)}
			{@render fileList(files)}
		</article>
	{:else if metaKey === 'researchArticles'}
		<article>
			<h1 class="text-3xl font-bold tracking-tight">{doc.title || 'Untitled'}</h1>
			<p class="mt-2 text-sm text-slate-500">
				{#if doc.author}By {doc.author}{/if}
				{#if doc.author && doc.years} &middot; {/if}
				{#if doc.years}{doc.years}{/if}
			</p>
			<div class="mt-3 h-1 w-12 bg-gmu-gold"></div>
			{#if doc.image}
				<img src={String(doc.image)} alt="" class="mt-6 max-h-[28rem] w-full rounded-lg border border-slate-200 bg-slate-50 object-contain" />
			{/if}
			{#if hasHtml(doc.content)}
				<div class="rich-content mt-6">{@html doc.content}</div>
			{:else}
				<p class="mt-6 text-sm text-slate-400">No content yet.</p>
			{/if}
			{@render galleryGrid(gallery)}
			{@render fileList(files)}
		</article>
	{/if}
</div>
