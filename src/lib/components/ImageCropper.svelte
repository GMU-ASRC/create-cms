<script lang="ts">
	import Icon from '@iconify/svelte';
	import { onMount } from 'svelte';
	import Cropper from 'svelte-easy-crop';

	type PixelCrop = { x: number; y: number; width: number; height: number };

	let {
		file,
		onCancel,
		onUpload
	}: {
		file: File;
		onCancel: () => void;
		onUpload: (file: File) => void;
	} = $props();

	const aspects = [
		{ label: 'Square', value: 1 },
		{ label: '4:3', value: 4 / 3 },
		{ label: '16:9', value: 16 / 9 },
		{ label: 'Portrait', value: 3 / 4 }
	];

	let src = $state('');
	let crop = $state({ x: 0, y: 0 });
	let zoom = $state(1);
	let aspect = $state(1);
	let pixels = $state<PixelCrop | null>(null);
	let working = $state(false);

	onMount(() => {
		const reader = new FileReader();
		reader.onload = () => (src = String(reader.result));
		reader.readAsDataURL(file);
	});

	function onCropComplete(event: { pixels: PixelCrop }) {
		pixels = event.pixels;
	}

	function croppedBlob(): Promise<Blob> {
		return new Promise((resolve, reject) => {
			if (!pixels) {
				reject(new Error('Nothing to crop'));
				return;
			}
			const area = pixels;
			const image = new Image();
			image.onload = () => {
				const canvas = document.createElement('canvas');
				canvas.width = area.width;
				canvas.height = area.height;
				const context = canvas.getContext('2d');
				if (!context) {
					reject(new Error('Canvas not supported'));
					return;
				}
				context.drawImage(
					image,
					area.x,
					area.y,
					area.width,
					area.height,
					0,
					0,
					area.width,
					area.height
				);
				const type = /^data:(image\/[a-z+]+);/.exec(src)?.[1] ?? 'image/png';
				canvas.toBlob(
					(blob) => (blob ? resolve(blob) : reject(new Error('Crop failed'))),
					type,
					0.92
				);
			};
			image.onerror = () => reject(new Error('Could not load image'));
			image.src = src;
		});
	}

	async function cropAndUpload() {
		working = true;
		try {
			const blob = await croppedBlob();
			onUpload(new File([blob], file.name, { type: blob.type }));
		} catch {
			working = false;
		}
	}
</script>

<div class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
	<div class="flex w-full max-w-2xl flex-col overflow-hidden rounded-xl bg-white shadow-xl">
		<div class="flex items-center justify-between border-b border-slate-200 px-4 py-3">
			<h2 class="font-semibold text-slate-900">Crop image</h2>
			<button
				type="button"
				class="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
				aria-label="Close"
				onclick={onCancel}
			>
				<Icon icon="mdi:close" width="20" />
			</button>
		</div>

		<div class="relative h-80 w-full bg-slate-900">
			{#if src}
				<Cropper image={src} bind:crop bind:zoom {aspect} oncropcomplete={onCropComplete} />
			{/if}
		</div>

		<div class="space-y-4 px-4 py-4">
			<div class="flex flex-wrap items-center gap-2">
				<span class="text-xs font-semibold tracking-wide text-muted uppercase">Aspect</span>
				{#each aspects as option (option.label)}
					<button
						type="button"
						onclick={() => (aspect = option.value)}
						class="rounded-full border px-3 py-1 text-sm font-medium transition-colors {aspect ===
						option.value
							? 'border-gmu-green bg-gmu-green text-white'
							: 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'}"
					>
						{option.label}
					</button>
				{/each}
			</div>

			<label class="flex items-center gap-3">
				<span class="text-xs font-semibold tracking-wide text-muted uppercase">Zoom</span>
				<input type="range" min="1" max="3" step="0.01" bind:value={zoom} class="flex-1" />
			</label>

			<div class="flex flex-wrap items-center justify-end gap-3 border-t border-slate-100 pt-3">
				<button type="button" class="btn-secondary" onclick={onCancel}>Cancel</button>
				<button type="button" class="btn-secondary" onclick={() => onUpload(file)}>
					Use original
				</button>
				<button type="button" class="btn-primary" disabled={working || !pixels} onclick={cropAndUpload}>
					<Icon icon={working ? 'mdi:loading' : 'mdi:crop'} width="18" class={working ? 'animate-spin' : ''} />
					{working ? 'Uploading...' : 'Crop and upload'}
				</button>
			</div>
		</div>
	</div>
</div>
