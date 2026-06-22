<script lang="ts">
	import Icon from '@iconify/svelte';
	import { page } from '$app/state';

	const isNotFound = $derived(page.status === 404);
</script>

<svelte:head><title>{page.status} | CREATE CMS</title></svelte:head>

<div class="flex min-h-[60vh] items-center justify-center px-4 py-12">
	<div class="card w-full max-w-md p-8 text-center">
		<span
			class="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gmu-green-light text-gmu-green"
		>
			<Icon icon={isNotFound ? 'mdi:map-marker-question-outline' : 'mdi:alert-circle-outline'} width="30" />
		</span>
		<p class="mt-4 font-mono text-sm font-semibold text-muted">Error {page.status}</p>
		<h1 class="mt-1 text-xl font-bold">
			{isNotFound ? 'Page not found' : 'Something went wrong'}
		</h1>
		<p class="mt-2 text-sm text-muted">
			{page.error?.message ?? 'An unexpected error occurred.'}
		</p>
		<a href="/" class="btn-primary mt-6 inline-flex">
			<Icon icon="mdi:view-dashboard-outline" width="18" />
			Back to dashboard
		</a>
	</div>
</div>
