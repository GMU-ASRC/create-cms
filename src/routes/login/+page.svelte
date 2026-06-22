<script lang="ts">
	let { data, form } = $props();

	const bootstrap = $derived(data.needsBootstrap);
	const action = $derived(bootstrap ? '?/register' : '?/login');
</script>

<svelte:head><title>Sign in | CREATE CMS</title></svelte:head>

<div
	class="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-10"
	style="background: radial-gradient(circle at 50% -20%, var(--color-gmu-green-light), var(--color-canvas) 60%);"
>
	<div
		class="pointer-events-none absolute inset-0 opacity-[0.04]"
		style="background-image: radial-gradient(var(--color-gmu-green) 1px, transparent 1px); background-size: 22px 22px;"
	></div>

	<div class="card animate-rise relative w-full max-w-sm overflow-hidden p-8">
		<div class="absolute inset-x-0 top-0 h-1 bg-gmu-gold"></div>
		<div class="flex flex-col items-center text-center">
			<img src={data.logo || '/create_logo.png'} alt="CREATE Lab" class="h-16 w-auto" />
			<h1 class="mt-4 text-xl font-bold">CREATE CMS</h1>
			<p class="page-subtitle">
				{bootstrap ? 'Create the first admin account.' : 'Sign in to manage content.'}
			</p>
		</div>

		<form method="POST" {action} class="mt-6 space-y-4">
			<div>
				<label for="email" class="field-label">Email</label>
				<input
					id="email"
					name="email"
					type="email"
					autocomplete="email"
					required
					value={form?.email ?? ''}
					class="field-input"
				/>
			</div>
			<div>
				<label for="password" class="field-label">Password</label>
				<input
					id="password"
					name="password"
					type="password"
					autocomplete={bootstrap ? 'new-password' : 'current-password'}
					required
					class="field-input"
				/>
			</div>
			{#if form?.error}
				<p class="alert-error">{form.error}</p>
			{/if}
			<button class="btn-primary w-full">
				{bootstrap ? 'Create account' : 'Sign in'}
			</button>
		</form>
	</div>
</div>
