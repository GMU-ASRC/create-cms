<script lang="ts">
	import Icon from '@iconify/svelte';
	import { confirmRequest } from '$lib/confirm';

	function respond(value: boolean) {
		const request = $confirmRequest;
		confirmRequest.set(null);
		request?.resolve(value);
	}

	function onKeydown(event: KeyboardEvent) {
		if (!$confirmRequest) return;
		if (event.key === 'Escape') {
			event.preventDefault();
			respond(false);
		} else if (event.key === 'Enter') {
			event.preventDefault();
			respond(true);
		}
	}
</script>

<svelte:window onkeydown={onKeydown} />

{#if $confirmRequest}
	<div
		class="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm"
		role="presentation"
		onclick={(event) => {
			if (event.target === event.currentTarget) respond(false);
		}}
	>
		<div
			class="w-full max-w-md rounded-xl bg-white p-6 shadow-xl"
			role="alertdialog"
			aria-modal="true"
			aria-label={$confirmRequest.title ?? 'Confirm'}
		>
			<div class="flex items-start gap-3">
				<span
					class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full {$confirmRequest.danger
						? 'bg-red-100 text-red-600'
						: 'bg-gmu-green-light text-gmu-green'}"
				>
					<Icon
						icon={$confirmRequest.danger ? 'mdi:alert-outline' : 'mdi:help-circle-outline'}
						width="22"
					/>
				</span>
				<div class="min-w-0 flex-1">
					<h2 class="text-base font-semibold text-slate-900">
						{$confirmRequest.title ?? 'Are you sure?'}
					</h2>
					<p class="mt-1 text-sm text-slate-600">{$confirmRequest.message}</p>
				</div>
			</div>
			<div class="mt-6 flex justify-end gap-3">
				<button type="button" class="btn-secondary" onclick={() => respond(false)}>
					{$confirmRequest.cancelLabel ?? 'Cancel'}
				</button>
				<button
					type="button"
					class={$confirmRequest.danger ? 'btn-danger' : 'btn-primary'}
					onclick={() => respond(true)}
				>
					{$confirmRequest.confirmLabel ?? 'Confirm'}
				</button>
			</div>
		</div>
	</div>
{/if}
