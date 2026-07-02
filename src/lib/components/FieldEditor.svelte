<script lang="ts">
	import { untrack } from 'svelte';
	import Icon from '@iconify/svelte';
	import FieldEditor from './FieldEditor.svelte';
	import RichTextField from './RichTextField.svelte';
	import ReferenceField from './ReferenceField.svelte';
	import MemberField from './MemberField.svelte';
	import MediaPicker from './MediaPicker.svelte';
	import FilePicker from './FilePicker.svelte';
	import AuthorField from './AuthorField.svelte';
	import MediaImagePicker from './MediaImagePicker.svelte';
	import ImageCropper from './ImageCropper.svelte';
	import { isFieldVisible, type Field } from '$lib/schema';

	let { field, container }: { field: Field; container: Record<string, any> } = $props();

	const visible = $derived(isFieldVisible(field, container));

	let uploading = $state(false);
	let uploadError = $state('');
	let cropFile = $state<File | null>(null);
	let showMediaPicker = $state(false);

	function pickFromMedia(path: string) {
		container[field.key] = path;
		showMediaPicker = false;
	}

	const autoSlugFrom = $derived('autoSlugFrom' in field ? (field.autoSlugFrom ?? '') : '');
	let slugEdited = $state(
		untrack(() => Boolean(autoSlugFrom) && Boolean(container[field.key]))
	);

	function slugify(value: unknown): string {
		return String(value ?? '')
			.toLowerCase()
			.trim()
			.replace(/[^a-z0-9]+/g, '-')
			.replace(/^-+|-+$/g, '');
	}

	function generateSlug() {
		container[field.key] = slugify(container[autoSlugFrom]);
		slugEdited = true;
	}

	$effect(() => {
		if (!autoSlugFrom || slugEdited) return;
		container[field.key] = slugify(container[autoSlugFrom]);
	});

	async function sendUpload(file: File) {
		uploading = true;
		uploadError = '';
		try {
			const body = new FormData();
			body.append('file', file);
			const response = await fetch('/admin/upload', { method: 'POST', body });
			if (!response.ok) throw new Error('Upload failed');
			const result = await response.json();
			container[field.key] = result.path;
		} catch {
			uploadError = 'Upload failed. Try again.';
		} finally {
			uploading = false;
		}
	}

	async function uploadFile(event: Event) {
		const input = event.target as HTMLInputElement;
		const file = input.files?.[0];
		input.value = '';
		if (file) await sendUpload(file);
	}

	function selectImage(event: Event) {
		const input = event.target as HTMLInputElement;
		const file = input.files?.[0];
		input.value = '';
		if (file) cropFile = file;
	}

	function uploadCropped(file: File) {
		cropFile = null;
		sendUpload(file);
	}

	function addString() {
		container[field.key].push('');
	}
	function removeString(index: number) {
		container[field.key].splice(index, 1);
	}

	function addItem() {
		if (field.type !== 'objectList') return;
		container[field.key].push(structuredClone(field.template));
	}
	function removeItem(index: number) {
		container[field.key].splice(index, 1);
	}

	let dragIndex = $state<number | null>(null);

	function onItemDragStart(index: number) {
		dragIndex = index;
	}
	function onItemDragOver(event: DragEvent, index: number) {
		event.preventDefault();
		if (dragIndex === null || dragIndex === index) return;
		const list = container[field.key];
		const [moved] = list.splice(dragIndex, 1);
		list.splice(index, 0, moved);
		dragIndex = index;
	}
</script>

{#snippet req()}
	{#if 'required' in field && field.required}<span class="ml-0.5 text-red-600">*</span>{/if}
{/snippet}

{#if visible}
{#if field.type === 'text' || field.type === 'url'}
	<div>
		<label class="field-label" for={field.key}>{field.label}{@render req()}</label>
		{#if field.type === 'text' && autoSlugFrom}
			<div class="mt-1 flex items-center gap-2">
				<input
					id={field.key}
					class="field-input"
					type="text"
					bind:value={container[field.key]}
					oninput={() => (slugEdited = true)}
				/>
				<button type="button" class="btn-secondary shrink-0" onclick={generateSlug}>
					<Icon icon="mdi:auto-fix" width="16" />
					Generate
				</button>
			</div>
		{:else}
			<input
				id={field.key}
				class="field-input"
				type={field.type === 'url' ? 'url' : 'text'}
				placeholder={'placeholder' in field ? (field.placeholder ?? '') : ''}
				bind:value={container[field.key]}
			/>
		{/if}
		{#if field.help || field.helpLink}
			<p class="mt-1 text-xs text-muted">
				{#if field.help}{field.help}{/if}
				{#if field.helpLink}
					<a
						href={field.helpLink.url}
						target="_blank"
						rel="noopener noreferrer"
						class="font-medium text-gmu-green hover:underline"
					>
						{field.helpLink.label}
					</a>
				{/if}
			</p>
		{/if}
	</div>
{:else if field.type === 'textarea'}
	<div>
		<label class="field-label" for={field.key}>{field.label}{@render req()}</label>
		<textarea id={field.key} rows="4" class="field-input" bind:value={container[field.key]}></textarea>
	</div>
{:else if field.type === 'richtext'}
	<div>
		<span class="field-label">{field.label}{@render req()}</span>
		{#if field.help}<p class="mt-1 mb-2 text-xs text-muted">{field.help}</p>{/if}
		<RichTextField {container} fieldKey={field.key} placeholder={field.placeholder ?? 'Start writing...'} />
	</div>
{:else if field.type === 'number'}
	<div>
		<label class="field-label" for={field.key}>{field.label}{@render req()}</label>
		<input id={field.key} type="number" class="field-input sm:max-w-40" bind:value={container[field.key]} />
	</div>
{:else if field.type === 'boolean'}
	<div>
		<label class="flex items-center gap-2.5">
			<input
				type="checkbox"
				class="h-4 w-4 rounded border-slate-300 text-gmu-green focus:ring-gmu-green"
				bind:checked={container[field.key]}
			/>
			<span class="field-label">{field.label}</span>
		</label>
		{#if field.help}<p class="mt-1 text-xs text-muted">{field.help}</p>{/if}
	</div>
{:else if field.type === 'select'}
	<div>
		<label class="field-label" for={field.key}>{field.label}{@render req()}</label>
		<select id={field.key} class="field-input sm:max-w-60" bind:value={container[field.key]}>
			{#each field.options as option (option)}
				<option value={option}>{option}</option>
			{/each}
		</select>
	</div>
{:else if field.type === 'image'}
	<div>
		<span class="field-label">{field.label}{@render req()}</span>
		<div class="mt-1 flex flex-wrap items-center gap-4">
			{#if container[field.key]}
				<img
					src={String(container[field.key])}
					alt=""
					class="h-20 w-20 rounded-lg border border-slate-200 bg-slate-50 object-contain"
				/>
			{:else}
				<div class="flex h-20 w-20 items-center justify-center rounded-lg border border-dashed border-slate-300 text-slate-300">
					<Icon icon="mdi:image-outline" width="26" />
				</div>
			{/if}
			<div class="flex flex-col gap-2">
				<label class="btn-secondary cursor-pointer">
					<Icon icon="mdi:upload" width="16" />
					{uploading ? 'Uploading...' : 'Upload'}
					<input type="file" accept="image/*" class="hidden" onchange={selectImage} disabled={uploading} />
				</label>
				<button type="button" class="btn-secondary" onclick={() => (showMediaPicker = true)}>
					<Icon icon="mdi:image-search-outline" width="16" />
					Media library
				</button>
				{#if container[field.key]}
					<button
						type="button"
						class="text-xs font-medium text-red-600 hover:underline"
						onclick={() => (container[field.key] = '')}
					>
						Remove
					</button>
				{/if}
			</div>
		</div>
		<input class="field-input mt-2" type="text" placeholder="or paste an image path / URL" bind:value={container[field.key]} />
		{#if field.help}<p class="mt-1 text-xs text-muted">{field.help}</p>{/if}
		{#if uploadError}<p class="mt-1 text-xs text-red-600">{uploadError}</p>{/if}
		{#if cropFile}
			<ImageCropper file={cropFile} onCancel={() => (cropFile = null)} onUpload={uploadCropped} />
		{/if}
		{#if showMediaPicker}
			<MediaImagePicker onSelect={pickFromMedia} onClose={() => (showMediaPicker = false)} />
		{/if}
	</div>
{:else if field.type === 'date'}
	<div>
		<label class="field-label" for={field.key}>{field.label}{@render req()}</label>
		<input id={field.key} type="date" class="field-input sm:max-w-60" bind:value={container[field.key]} />
		{#if field.help}<p class="mt-1 text-xs text-muted">{field.help}</p>{/if}
	</div>
{:else if field.type === 'file'}
	<div>
		<span class="field-label">{field.label}{@render req()}</span>
		<div class="mt-1 flex flex-wrap items-center gap-4">
			{#if container[field.key]}
				<a
					href={String(container[field.key])}
					target="_blank"
					rel="noopener noreferrer"
					class="inline-flex items-center gap-1 text-sm font-medium text-gmu-green hover:underline"
				>
					<Icon icon="mdi:file-pdf-box" width="18" />
					View PDF
				</a>
			{/if}
			<div class="flex flex-col gap-2">
				<label class="btn-secondary cursor-pointer">
					<Icon icon="mdi:upload" width="16" />
					{uploading ? 'Uploading...' : 'Upload'}
					<input type="file" accept="application/pdf" class="hidden" onchange={uploadFile} disabled={uploading} />
				</label>
				{#if container[field.key]}
					<button
						type="button"
						class="text-xs font-medium text-red-600 hover:underline"
						onclick={() => (container[field.key] = '')}
					>
						Remove
					</button>
				{/if}
			</div>
		</div>
		<input class="field-input mt-2" type="text" placeholder="or paste a PDF link" bind:value={container[field.key]} />
		{#if field.help}<p class="mt-1 text-xs text-muted">{field.help}</p>{/if}
		{#if uploadError}<p class="mt-1 text-xs text-red-600">{uploadError}</p>{/if}
	</div>
{:else if field.type === 'references'}
	<div>
		<span class="field-label">{field.label}{@render req()}</span>
		{#if field.help}<p class="mt-1 mb-2 text-xs text-muted">{field.help}</p>{/if}
		<ReferenceField {container} fieldKey={field.key} />
	</div>
{:else if field.type === 'mediaList'}
	<div>
		<span class="field-label">{field.label}{@render req()}</span>
		{#if field.help}<p class="mt-1 mb-2 text-xs text-muted">{field.help}</p>{/if}
		<MediaPicker {container} fieldKey={field.key} />
	</div>
{:else if field.type === 'files'}
	<div>
		<span class="field-label">{field.label}{@render req()}</span>
		{#if field.help}<p class="mt-1 mb-2 text-xs text-muted">{field.help}</p>{/if}
		<FilePicker {container} fieldKey={field.key} />
	</div>
{:else if field.type === 'author'}
	<div>
		<span class="field-label">{field.label}{@render req()}</span>
		{#if field.help}<p class="mt-1 mb-2 text-xs text-muted">{field.help}</p>{/if}
		<AuthorField {container} fieldKey={field.key} placeholder={field.placeholder ?? ''} />
	</div>
{:else if field.type === 'members'}
	<div>
		<span class="field-label">{field.label}{@render req()}</span>
		{#if field.help}<p class="mt-1 mb-2 text-xs text-muted">{field.help}</p>{/if}
		<MemberField {container} fieldKey={field.key} />
	</div>
{:else if field.type === 'stringList'}
	<div>
		<span class="field-label">{field.label}{@render req()}</span>
		{#if field.help}<p class="mt-1 text-xs text-muted">{field.help}</p>{/if}
		<div class="mt-1 space-y-2">
			{#each container[field.key] as _, index (index)}
				<div class="flex items-center gap-2">
					<input class="field-input" type="text" bind:value={container[field.key][index]} />
					<button
						type="button"
						class="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600"
						aria-label="Remove"
						onclick={() => removeString(index)}
					>
						<Icon icon="mdi:close" width="18" />
					</button>
				</div>
			{/each}
		</div>
		<button type="button" class="btn-secondary mt-2" onclick={addString}>
			<Icon icon="mdi:plus" width="16" />
			Add {field.itemLabel ?? 'item'}
		</button>
	</div>
{:else if field.type === 'group'}
	<fieldset class="rounded-xl border border-slate-200 bg-slate-50 p-4">
		<legend class="px-2 text-sm font-semibold text-slate-700">{field.label}</legend>
		<div class="space-y-4">
			{#each field.fields as sub (sub.key)}
				<FieldEditor field={sub} container={container[field.key]} />
			{/each}
		</div>
	</fieldset>
{:else if field.type === 'objectList'}
	<div>
		<span class="field-label">{field.label}{@render req()}</span>
		{#if field.help}<p class="mt-1 text-xs text-muted">{field.help}</p>{/if}
		<div class="mt-1 space-y-4" role="list">
			{#each container[field.key] as item, index (index)}
				<div
					class="rounded-xl border border-slate-200 bg-slate-50 p-4 {dragIndex === index
						? 'opacity-60'
						: ''}"
					ondragover={(event) => onItemDragOver(event, index)}
					ondrop={() => (dragIndex = null)}
					ondragend={() => (dragIndex = null)}
					role="listitem"
				>
					<div class="mb-3 flex items-center justify-between">
						<span class="flex items-center gap-2 text-xs font-semibold tracking-wide text-muted uppercase">
							{#if container[field.key].length > 1}
								<span
									class="cursor-grab text-slate-400 hover:text-slate-600"
									draggable="true"
									ondragstart={() => onItemDragStart(index)}
									role="button"
									tabindex="-1"
									aria-label="Drag to reorder"
								>
									<Icon icon="mdi:drag-vertical" width="18" />
								</span>
							{/if}
							{field.itemLabel}
							{index + 1}
						</span>
						<button
							type="button"
							class="flex items-center gap-1 text-xs font-medium text-red-600 hover:underline"
							onclick={() => removeItem(index)}
						>
							<Icon icon="mdi:trash-can-outline" width="14" />
							Remove
						</button>
					</div>
					<div class="space-y-4">
						{#each field.fields as sub (sub.key)}
							<FieldEditor field={sub} container={item} />
						{/each}
					</div>
				</div>
			{/each}
		</div>
		<button type="button" class="btn-secondary mt-2" onclick={addItem}>
			<Icon icon="mdi:plus" width="16" />
			Add {field.itemLabel}
		</button>
	</div>
{/if}
{/if}
