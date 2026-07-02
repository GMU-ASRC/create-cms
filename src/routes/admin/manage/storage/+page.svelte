<script lang="ts">
	import Icon from '@iconify/svelte';

	let { data } = $props();

	function formatBytes(bytes: number): string {
		if (bytes >= 1_000_000_000) return `${(bytes / 1_000_000_000).toFixed(2)} GB`;
		if (bytes >= 1_000_000) return `${(bytes / 1_000_000).toFixed(1)} MB`;
		if (bytes >= 1000) return `${(bytes / 1000).toFixed(0)} KB`;
		return `${bytes} B`;
	}

	function percent(part: number, total: number): number {
		return total > 0 ? Math.round((part / total) * 100) : 0;
	}
</script>

{#if data.error}
	<div class="card empty-state">
		<Icon icon="mdi:cloud-alert-outline" width="32" class="text-red-300" />
		<p>Could not read storage stats.</p>
		<p class="text-xs text-red-600">{data.error}</p>
	</div>
{:else if data.stats}
	{@const stats = data.stats}
	{@const usedPercent = percent(stats.totalBytes, stats.limitBytes)}
	<div class="card p-5">
		<div class="flex flex-wrap items-baseline justify-between gap-2">
			<p class="text-sm font-semibold text-slate-700">Storage used</p>
			<p class="text-sm text-muted">
				<span class="font-semibold text-slate-900">{formatBytes(stats.totalBytes)}</span>
				of {formatBytes(stats.limitBytes)} ({usedPercent}%)
			</p>
		</div>
		<div class="mt-3 h-3 w-full overflow-hidden rounded-full bg-slate-100">
			<div
				class="h-full rounded-full {usedPercent >= 90
					? 'bg-red-500'
					: usedPercent >= 75
						? 'bg-gmu-gold'
						: 'bg-gmu-green'}"
				style="width: {Math.min(100, usedPercent)}%"
			></div>
		</div>
		{#if usedPercent >= 90}
			<p class="mt-2 text-xs font-medium text-red-600">
				Storage is almost full. Uploads will be blocked once the limit is reached.
			</p>
		{/if}
	</div>

	<div class="mt-4 grid gap-4 sm:grid-cols-3">
		<div class="card p-5">
			<p class="flex items-center gap-2 text-xs font-semibold tracking-wide text-muted uppercase">
				<Icon icon="mdi:database-outline" width="16" />
				Total used
			</p>
			<p class="mt-2 text-2xl font-bold text-slate-900">{formatBytes(stats.totalBytes)}</p>
			<p class="mt-1 text-sm text-muted">{stats.totalObjects} objects</p>
		</div>
		<div class="card p-5">
			<p class="flex items-center gap-2 text-xs font-semibold tracking-wide text-muted uppercase">
				<Icon icon="mdi:image-multiple-outline" width="16" />
				Media
			</p>
			<p class="mt-2 text-2xl font-bold text-slate-900">{formatBytes(stats.media.bytes)}</p>
			<p class="mt-1 text-sm text-muted">{stats.media.objects} files</p>
		</div>
		<div class="card p-5">
			<p class="flex items-center gap-2 text-xs font-semibold tracking-wide text-muted uppercase">
				<Icon icon="mdi:archive-outline" width="16" />
				Snapshots
			</p>
			<p class="mt-2 text-2xl font-bold text-slate-900">{formatBytes(stats.snapshots.bytes)}</p>
			<p class="mt-1 text-sm text-muted">{stats.snapshots.objects} archives</p>
		</div>
	</div>

	{#if stats.totalBytes > 0}
		<div class="card mt-4 p-5">
			<p class="mb-3 text-sm font-semibold text-slate-700">Usage by type</p>
			<div class="flex h-3 w-full overflow-hidden rounded-full bg-slate-100">
				<div
					class="bg-gmu-green"
					style="width: {percent(stats.media.bytes, stats.totalBytes)}%"
					title="Media"
				></div>
				<div
					class="bg-gmu-gold"
					style="width: {percent(stats.snapshots.bytes, stats.totalBytes)}%"
					title="Snapshots"
				></div>
			</div>
			<div class="mt-3 flex flex-wrap gap-4 text-xs text-muted">
				<span class="inline-flex items-center gap-1.5">
					<span class="h-2.5 w-2.5 rounded-full bg-gmu-green"></span>
					Media {percent(stats.media.bytes, stats.totalBytes)}%
				</span>
				<span class="inline-flex items-center gap-1.5">
					<span class="h-2.5 w-2.5 rounded-full bg-gmu-gold"></span>
					Snapshots {percent(stats.snapshots.bytes, stats.totalBytes)}%
				</span>
			</div>
		</div>
	{/if}

	<dl class="card mt-4 divide-y divide-slate-100 p-0 text-sm">
		<div class="flex items-center justify-between px-5 py-3">
			<dt class="text-muted">Bucket</dt>
			<dd class="font-medium text-slate-800">{stats.bucket}</dd>
		</div>
		<div class="flex items-center justify-between px-5 py-3">
			<dt class="text-muted">Endpoint</dt>
			<dd class="truncate pl-4 font-medium text-slate-800">{stats.endpoint}</dd>
		</div>
		<div class="flex items-center justify-between px-5 py-3">
			<dt class="text-muted">Largest object</dt>
			<dd class="font-medium text-slate-800">{formatBytes(stats.largestBytes)}</dd>
		</div>
		<div class="flex items-center justify-between px-5 py-3">
			<dt class="text-muted">Storage limit</dt>
			<dd class="font-medium text-slate-800">{formatBytes(stats.limitBytes)}</dd>
		</div>
	</dl>
{/if}
