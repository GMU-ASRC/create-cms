<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import Icon from '@iconify/svelte';
	import { Editor } from '@tiptap/core';
	import StarterKit from '@tiptap/starter-kit';
	import Image from '@tiptap/extension-image';
	import Link from '@tiptap/extension-link';
	import Placeholder from '@tiptap/extension-placeholder';

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
				StarterKit,
				Link.configure({ openOnClick: false }),
				AlignImage,
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
			const body = new FormData();
			body.append('file', file);
			const response = await fetch('/admin/upload', { method: 'POST', body });
			if (response.ok) {
				const { path } = await response.json();
				editor?.chain().focus().setImage({ src: path, align: 'center' }).run();
			}
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
		<span class="mx-1 h-5 w-px bg-slate-300"></span>
		{@render button(toggleLink, isActive('link'), 'mdi:link-variant', 'Link')}
		{@render button(
			() => fileInput.click(),
			false,
			uploading ? 'mdi:loading' : 'mdi:image-plus',
			'Insert image'
		)}
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
