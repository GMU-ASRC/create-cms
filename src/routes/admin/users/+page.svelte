<script lang="ts">
	import Icon from '@iconify/svelte';

	let { data, form } = $props();
</script>

<svelte:head><title>Users | CREATE CMS</title></svelte:head>

<h1 class="page-title">Users</h1>
<p class="page-subtitle">Editors who can sign in and manage content.</p>

<form
	method="POST"
	action="?/create"
	class="card mt-6 grid gap-3 p-4 sm:grid-cols-2 sm:items-end lg:grid-cols-[1fr_1fr_auto]"
>
	<div>
		<label for="email" class="field-label">Email</label>
		<input id="email" name="email" type="email" autocomplete="off" required class="field-input" />
	</div>
	<div>
		<label for="password" class="field-label">Password</label>
		<input id="password" name="password" type="password" autocomplete="new-password" required class="field-input" />
	</div>
	<button class="btn-primary w-full sm:col-span-2 lg:col-span-1 lg:w-auto">
		<Icon icon="mdi:account-plus-outline" width="18" />
		Add user
	</button>
	{#if form?.error}
		<p class="alert-error sm:col-span-2 lg:col-span-3">{form.error}</p>
	{/if}
</form>

<div class="card mt-6 overflow-hidden">
	<ul class="divide-y divide-slate-100">
		{#each data.users as user (user.id)}
			<li class="flex items-center justify-between gap-3 px-5 py-3.5">
				<span class="flex min-w-0 items-center gap-2.5">
					<Icon icon="mdi:account-circle-outline" width="22" class="shrink-0 text-slate-400" />
					<span class="truncate text-sm font-medium">{user.email}</span>
				</span>
				{#if user.id !== data.currentUserId}
					<form method="POST" action="?/delete" class="shrink-0">
						<input type="hidden" name="id" value={user.id} />
						<button class="flex items-center gap-1 text-xs font-medium text-red-600 hover:underline">
							<Icon icon="mdi:account-remove-outline" width="16" />
							Remove
						</button>
					</form>
				{:else}
					<span class="badge-green shrink-0">You</span>
				{/if}
			</li>
		{/each}
	</ul>
</div>
