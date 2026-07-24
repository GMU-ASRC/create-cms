<script lang="ts">
	import QRCode from 'qrcode';
	import Icon from '@iconify/svelte';
	import { invalidateAll } from '$app/navigation';
	import { uploadToStorage } from '$lib/upload';

	let text = $state('');
	let errorLevel = $state<'L' | 'M' | 'Q' | 'H'>('M');
	let filename = $state('qrcode');
	let canvasEl = $state<HTMLCanvasElement | null>(null);
	let generateError = $state('');
	let saving = $state(false);
	let saved = $state(false);

	const hasText = $derived(text.trim().length > 0);

	async function draw() {
		if (!canvasEl) return;
		saved = false;
		const value = text.trim();
		if (!value) {
			canvasEl.getContext('2d')?.clearRect(0, 0, canvasEl.width, canvasEl.height);
			generateError = '';
			return;
		}
		try {
			await QRCode.toCanvas(canvasEl, value, { errorCorrectionLevel: errorLevel, width: 320, margin: 2 });
			generateError = '';
		} catch {
			generateError = 'Could not generate a QR code for this text.';
		}
	}

	$effect(() => {
		void text;
		void errorLevel;
		draw();
	});

	function download() {
		if (!canvasEl || !hasText) return;
		const link = document.createElement('a');
		link.download = `${filename.trim() || 'qrcode'}.png`;
		link.href = canvasEl.toDataURL('image/png');
		link.click();
	}

	async function saveToMedia() {
		if (!canvasEl || !hasText) return;
		saving = true;
		generateError = '';
		try {
			const blob = await new Promise<Blob | null>((resolve) => canvasEl?.toBlob(resolve, 'image/png'));
			if (!blob) throw new Error('Could not create image');
			const file = new File([blob], `${filename.trim() || 'qrcode'}.png`, { type: 'image/png' });
			await uploadToStorage(file);
			saved = true;
			await invalidateAll();
		} catch {
			generateError = 'Saving to the media library failed.';
		} finally {
			saving = false;
		}
	}
</script>

<div class="card mt-6 p-4">
	<div class="grid gap-6 sm:grid-cols-[2fr_1fr]">
		<div>
			<label class="field-label" for="qr-text">Text or URL</label>
			<textarea
				id="qr-text"
				rows="3"
				class="field-input"
				placeholder="https://example.com"
				bind:value={text}
			></textarea>

			<div class="mt-3 grid gap-3 sm:grid-cols-2">
				<div>
					<label class="field-label" for="qr-level">Error correction</label>
					<select id="qr-level" class="field-input" bind:value={errorLevel}>
						<option value="L">Low (~7%)</option>
						<option value="M">Medium (~15%)</option>
						<option value="Q">Quartile (~25%)</option>
						<option value="H">High (~30%)</option>
					</select>
				</div>
				<div>
					<label class="field-label" for="qr-filename">File name</label>
					<input id="qr-filename" class="field-input" bind:value={filename} placeholder="qrcode" />
				</div>
			</div>

			{#if generateError}<p class="alert-error mt-3">{generateError}</p>{/if}
		</div>

		<div class="flex flex-col items-center gap-3">
			<div class="flex h-52 w-52 items-center justify-center rounded-lg border border-slate-200 bg-slate-50">
				<canvas bind:this={canvasEl} width="320" height="320" class="h-full w-full object-contain"></canvas>
			</div>
			<div class="flex w-full flex-col gap-2">
				<button type="button" class="btn-secondary w-full" disabled={!hasText} onclick={download}>
					<Icon icon="mdi:download" width="16" />
					Download PNG
				</button>
				<button type="button" class="btn-primary w-full" disabled={!hasText || saving} onclick={saveToMedia}>
					<Icon
						icon={saving ? 'mdi:loading' : saved ? 'mdi:check' : 'mdi:content-save-outline'}
						width="16"
						class={saving ? 'animate-spin' : ''}
					/>
					{saving ? 'Saving...' : saved ? 'Saved to Media' : 'Save to Media Library'}
				</button>
			</div>
		</div>
	</div>
</div>
