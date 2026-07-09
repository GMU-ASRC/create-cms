<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import Icon from '@iconify/svelte';
	import { Editor } from '@tiptap/core';
	import StarterKit from '@tiptap/starter-kit';
	import Image from '@tiptap/extension-image';
	import Link from '@tiptap/extension-link';
	import Placeholder from '@tiptap/extension-placeholder';
	import Youtube from '@tiptap/extension-youtube';
	import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
	import { createLowlight, common } from 'lowlight';
	import { uploadToStorage } from '$lib/upload';

	const lowlight = createLowlight(common);

	let {
		container,
		fieldKey,
		placeholder = 'Start writing...'
	}: { container: Record<string, any>; fieldKey: string; placeholder?: string } = $props();

	let element: HTMLDivElement;
	let fileInput: HTMLInputElement;
	let editor = $state<Editor>();
	let version = $state(0);
	let uploading = $state(false);
	let showYoutubeDialog = $state(false);
	let youtubeUrl = $state('');

	const AlignImage = Image.extend({
		addAttributes() {
			return {
				...this.parent?.(),
				align: {
					default: 'center',
					parseHTML: (el: HTMLElement) => {
						const match = (el.getAttribute('class') ?? '').match(/img-(left|right|center|full)/);
						return match ? match[1] : 'center';
					},
					renderHTML: (attrs: Record<string, unknown>) => ({ class: `img-${attrs.align}` })
				}
			};
		}
	});

	onMount(() => {
		editor = new Editor({
			element,
			extensions: [
				StarterKit.configure({ codeBlock: false }),
				Link.configure({ openOnClick: false }),
				AlignImage,
				CodeBlockLowlight.configure({ lowlight }),
				Youtube.configure({
					controls: true,
					nocookie: true,
					modestBranding: true,
					width: 640,
					height: 360
				}),
				Placeholder.configure({ placeholder })
			],
			content: container[fieldKey] || '',
			editorProps: { attributes: { class: 'rich-content' } },
			onUpdate: ({ editor }) => {
				container[fieldKey] = editor.isEmpty ? '' : editor.getHTML();
			},
			onTransaction: () => {
				version++;
			}
		});
	});

	onDestroy(() => editor?.destroy());

	function isActive(name: string, attrs?: Record<string, unknown>): boolean {
		void version;
		return editor?.isActive(name, attrs) ?? false;
	}

	const imageSelected = $derived((void version, editor?.isActive('image') ?? false));

	function setAlign(align: string) {
		editor?.chain().focus().updateAttributes('image', { align }).run();
	}

	function openYoutubeDialog() {
		youtubeUrl = '';
		showYoutubeDialog = true;
	}

	function insertYoutube() {
		const url = youtubeUrl.trim();
		if (url) editor?.commands.setYoutubeVideo({ src: url });
		showYoutubeDialog = false;
		youtubeUrl = '';
	}

	function toggleLink() {
		if (editor?.isActive('link')) {
			editor.chain().focus().unsetLink().run();
			return;
		}
		const url = prompt('Link URL');
		if (url) editor?.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
	}

	async function onImageChosen(event: Event) {
		const input = event.target as HTMLInputElement;
		const file = input.files?.[0];
		if (!file) return;
		uploading = true;
		try {
			const { path } = await uploadToStorage(file);
			editor?.chain().focus().setImage({ src: path, align: 'center' } as { src: string }).run();
		} finally {
			uploading = false;
			input.value = '';
		}
	}
</script>

{#snippet button(onclick: () => void, active: boolean, icon: string, label: string, disabled = false)}
	<button
		type="button"
		title={label}
		aria-label={label}
		{disabled}
		class="rounded p-1.5 text-slate-600 transition-colors hover:bg-slate-200 disabled:opacity-30 disabled:hover:bg-transparent {active
			? 'bg-gmu-green text-white hover:bg-gmu-green'
			: ''}"
		{onclick}
	>
		<Icon {icon} width="18" />
	</button>
{/snippet}

<div class="overflow-hidden rounded-xl border border-slate-300 bg-white">
	<div class="flex flex-wrap items-center gap-0.5 border-b border-slate-200 bg-slate-50 p-1.5">
		{@render button(
			() => editor?.chain().focus().toggleBold().run(),
			isActive('bold'),
			'mdi:format-bold',
			'Bold'
		)}
		{@render button(
			() => editor?.chain().focus().toggleItalic().run(),
			isActive('italic'),
			'mdi:format-italic',
			'Italic'
		)}
		<span class="mx-1 h-5 w-px bg-slate-300"></span>
		{@render button(
			() => editor?.chain().focus().toggleHeading({ level: 1 }).run(),
			isActive('heading', { level: 1 }),
			'mdi:format-header-1',
			'Heading 1'
		)}
		{@render button(
			() => editor?.chain().focus().toggleHeading({ level: 2 }).run(),
			isActive('heading', { level: 2 }),
			'mdi:format-header-2',
			'Heading 2'
		)}
		{@render button(
			() => editor?.chain().focus().toggleBulletList().run(),
			isActive('bulletList'),
			'mdi:format-list-bulleted',
			'Bullet list'
		)}
		{@render button(
			() => editor?.chain().focus().toggleOrderedList().run(),
			isActive('orderedList'),
			'mdi:format-list-numbered',
			'Numbered list'
		)}
		{@render button(
			() => editor?.chain().focus().toggleBlockquote().run(),
			isActive('blockquote'),
			'mdi:format-quote-close',
			'Quote'
		)}
		{@render button(
			() => editor?.chain().focus().toggleCodeBlock().run(),
			isActive('codeBlock'),
			'mdi:code-braces-box',
			'Code block'
		)}
		<span class="mx-1 h-5 w-px bg-slate-300"></span>
		{@render button(toggleLink, isActive('link'), 'mdi:link-variant', 'Link')}
		{@render button(
			() => fileInput.click(),
			false,
			uploading ? 'mdi:loading' : 'mdi:image-plus',
			'Insert image'
		)}
		{@render button(openYoutubeDialog, false, 'mdi:youtube', 'Embed YouTube video')}
		<span class="mx-1 h-5 w-px bg-slate-300"></span>
		{@render button(
			() => setAlign('left'),
			isActive('image', { align: 'left' }),
			'mdi:format-float-left',
			'Wrap left',
			!imageSelected
		)}
		{@render button(
			() => setAlign('center'),
			isActive('image', { align: 'center' }),
			'mdi:format-float-center',
			'Center',
			!imageSelected
		)}
		{@render button(
			() => setAlign('right'),
			isActive('image', { align: 'right' }),
			'mdi:format-float-right',
			'Wrap right',
			!imageSelected
		)}
		{@render button(
			() => setAlign('full'),
			isActive('image', { align: 'full' }),
			'mdi:format-float-none',
			'Full width',
			!imageSelected
		)}
	</div>

	<div bind:this={element} class="max-h-[640px] min-h-[220px] overflow-y-auto px-4 py-3"></div>
</div>

<input
	bind:this={fileInput}
	type="file"
	accept="image/*"
	class="hidden"
	onchange={onImageChosen}
/>

{#if showYoutubeDialog}
	<div
		class="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm"
		role="presentation"
		onclick={(event) => {
			if (event.target === event.currentTarget) showYoutubeDialog = false;
		}}
	>
		<div class="w-full max-w-md rounded-xl bg-white p-6 shadow-xl" role="dialog" aria-modal="true" aria-label="Embed YouTube video">
			<div class="flex items-start gap-3">
				<span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gmu-green-light text-gmu-green">
					<Icon icon="mdi:youtube" width="22" />
				</span>
				<div class="min-w-0 flex-1">
					<h2 class="text-base font-semibold text-slate-900">Embed YouTube video</h2>
					<p class="mt-1 text-sm text-slate-600">Paste a YouTube or YouTube Music link.</p>
				</div>
			</div>
			<!-- svelte-ignore a11y_autofocus -->
			<input
				type="url"
				class="field-input mt-4"
				placeholder="https://www.youtube.com/watch?v=..."
				autofocus
				bind:value={youtubeUrl}
				onkeydown={(event) => {
					if (event.key === 'Enter') {
						event.preventDefault();
						insertYoutube();
					} else if (event.key === 'Escape') {
						event.preventDefault();
						showYoutubeDialog = false;
					}
				}}
			/>
			<div class="mt-6 flex justify-end gap-3">
				<button type="button" class="btn-secondary" onclick={() => (showYoutubeDialog = false)}>Cancel</button>
				<button type="button" class="btn-primary" onclick={insertYoutube} disabled={!youtubeUrl.trim()}>
					<Icon icon="mdi:youtube" width="18" />
					Embed
				</button>
			</div>
		</div>
	</div>
{/if}
