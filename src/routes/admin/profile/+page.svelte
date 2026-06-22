<script lang="ts">
	import Icon from '@iconify/svelte';

	let { data, form } = $props();
</script>

<svelte:head><title>Profile | CREATE CMS</title></svelte:head>

<h1 class="page-title">Profile</h1>
<p class="page-subtitle">Update your login email and password.</p>

<form method="POST" action="?/email" class="card mt-6 space-y-4 p-5">
	<div class="flex items-center gap-2.5">
		<Icon icon="mdi:email-outline" width="22" class="text-slate-400" />
		<h2 class="text-base font-semibold text-slate-900">Login email</h2>
	</div>
	<div>
		<label for="email" class="field-label">Email</label>
		<input
			id="email"
			name="email"
			type="email"
			autocomplete="email"
			required
			value={data.email}
			class="field-input"
		/>
	</div>
	{#if form?.section === 'email' && form?.error}
		<p class="alert-error">{form.error}</p>
	{/if}
	{#if form?.section === 'email' && form?.success}
		<p class="alert-success">Email updated.</p>
	{/if}
	<button class="btn-primary">
		<Icon icon="mdi:content-save-outline" width="18" />
		Save email
	</button>
</form>

<form method="POST" action="?/password" class="card mt-6 space-y-4 p-5">
	<div class="flex items-center gap-2.5">
		<Icon icon="mdi:lock-outline" width="22" class="text-slate-400" />
		<h2 class="text-base font-semibold text-slate-900">Password</h2>
	</div>
	<div>
		<label for="currentPassword" class="field-label">Current password</label>
		<input
			id="currentPassword"
			name="currentPassword"
			type="password"
			autocomplete="current-password"
			required
			class="field-input"
		/>
	</div>
	<div>
		<label for="newPassword" class="field-label">New password</label>
		<input
			id="newPassword"
			name="newPassword"
			type="password"
			autocomplete="new-password"
			required
			class="field-input"
		/>
	</div>
	<div>
		<label for="confirmPassword" class="field-label">Confirm new password</label>
		<input
			id="confirmPassword"
			name="confirmPassword"
			type="password"
			autocomplete="new-password"
			required
			class="field-input"
		/>
	</div>
	{#if form?.section === 'password' && form?.error}
		<p class="alert-error">{form.error}</p>
	{/if}
	{#if form?.section === 'password' && form?.success}
		<p class="alert-success">Password updated.</p>
	{/if}
	<button class="btn-primary">
		<Icon icon="mdi:content-save-outline" width="18" />
		Change password
	</button>
</form>
