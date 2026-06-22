import { publicationTypeLabels } from './publications';

export type Field =
	| {
			key: string;
			label: string;
			type: 'text' | 'textarea' | 'url' | 'image' | 'richtext' | 'date' | 'file';
			required?: boolean;
			help?: string;
			placeholder?: string;
			autoSlugFrom?: string;
	  }
	| { key: string; label: string; type: 'number'; required?: boolean }
	| { key: string; label: string; type: 'boolean'; help?: string; default?: boolean }
	| { key: string; label: string; type: 'select'; options: string[]; required?: boolean }
	| { key: string; label: string; type: 'stringList'; itemLabel?: string; help?: string; required?: boolean }
	| { key: string; label: string; type: 'references'; help?: string; required?: boolean }
	| { key: string; label: string; type: 'mediaList'; help?: string; required?: boolean }
	| { key: string; label: string; type: 'members'; help?: string; required?: boolean }
	| { key: string; label: string; type: 'group'; fields: Field[]; required?: boolean }
	| {
			key: string;
			label: string;
			type: 'objectList';
			itemLabel: string;
			fields: Field[];
			template: Record<string, unknown>;
			required?: boolean;
			help?: string;
	  };

const socialKinds = ['scholar', 'orcid', 'linkedin', 'researchgate'];

export const schemas: Record<string, Field[]> = {
	siteInfo: [
		{ key: 'logo', label: 'Logo', type: 'image' },
		{ key: 'labName', label: 'Lab name', type: 'text', required: true },
		{ key: 'labFullName', label: 'Full name', type: 'text', required: true },
		{ key: 'institution', label: 'Institution', type: 'text', required: true },
		{ key: 'tagline', label: 'Tagline', type: 'text' },
		{ key: 'intro', label: 'Intro', type: 'textarea' },
		{
			key: 'heroImages',
			label: 'Hero images',
			type: 'mediaList',
			help: 'Select uploaded images for the homepage hero. Multiple images cross-fade.'
		},
		{
			key: 'showAccessibility',
			label: 'Show accessibility controls',
			type: 'boolean',
			default: true,
			help: 'Show the text size, high contrast, and reduce motion controls in the website footer.'
		},
		{
			key: 'contact',
			label: 'Contact',
			type: 'group',
			fields: [
				{ key: 'department', label: 'Department', type: 'text' },
				{ key: 'address', label: 'Address lines', type: 'stringList', itemLabel: 'Line' },
				{ key: 'email', label: 'Email', type: 'text' }
			]
		}
	],
	news: [
		{ key: 'title', label: 'Title', type: 'text', required: true },
		{ key: 'date', label: 'Date', type: 'date', required: true, help: 'Used to sort news entries, newest first.' },
		{
			key: 'body',
			label: 'Body',
			type: 'richtext',
			placeholder: 'Write the update...',
			help: 'Optional. Supports formatting, links, and images.'
		},
		{
			key: 'linkType',
			label: 'Read more link',
			type: 'select',
			options: ['none', 'external', 'article'],
			help: 'Where the "Read more" link points: nowhere, an external URL, or an internal research article.'
		},
		{ key: 'href', label: 'External link', type: 'url', help: 'Used when the link is set to external.' },
		{
			key: 'articleSlug',
			label: 'Research article slug',
			type: 'text',
			help: 'Used when the link is set to article. Must match a research article slug.'
		},
		{ key: 'order', label: 'Order', type: 'number' }
	],
	projects: [
		{ key: 'title', label: 'Title', type: 'text', required: true },
		{
			key: 'summary',
			label: 'Summary',
			type: 'textarea',
			help: 'Short description shown on the project card and at the top of the project page.'
		},
		{ key: 'status', label: 'Status', type: 'select', options: ['Active', 'Completed'] },
		{
			key: 'featured',
			label: 'Featured',
			type: 'boolean',
			help: 'Highlight this project in the projects section, shown first with a Featured badge.'
		},
		{
			key: 'tags',
			label: 'Tags',
			type: 'stringList',
			itemLabel: 'Tag',
			help: 'Keywords or topics shown as chips on the project page.'
		},
		{ key: 'image', label: 'Image', type: 'image', help: 'Main image shown on the card and project page.' },
		{
			key: 'content',
			label: 'Page content',
			type: 'richtext',
			help: 'The main write-up shown on the project page. Supports formatting, links, and images.'
		},
		{
			key: 'teamMembers',
			label: 'Team members',
			type: 'members',
			help: 'Search and select people from the Team page. You can also type a name and press Enter for outside collaborators.'
		},
		{
			key: 'funding',
			label: 'Funding',
			type: 'stringList',
			itemLabel: 'Source',
			help: 'Grants or sponsors supporting this project.'
		},
		{
			key: 'links',
			label: 'Resource links',
			type: 'objectList',
			itemLabel: 'Link',
			template: { label: '', href: '' },
			help: 'External resources such as papers, code, videos, or demos.',
			fields: [
				{ key: 'label', label: 'Label', type: 'text' },
				{ key: 'href', label: 'URL', type: 'url' }
			]
		},
		{
			key: 'gallery',
			label: 'Gallery',
			type: 'mediaList',
			help: 'Additional images shown in a gallery on the project page.'
		},
		{
			key: 'relatedPublications',
			label: 'Related publications',
			type: 'references',
			help: 'Search and select publications to list on the project page.'
		},
		{
			key: 'linkType',
			label: 'Card link',
			type: 'select',
			options: ['page', 'external', 'article'],
			help: "Where the project card points: this site's project page, an external URL, or an internal research article."
		},
		{ key: 'href', label: 'External link', type: 'url', help: 'Used when the card link is set to external.' },
		{
			key: 'slug',
			label: 'Slug',
			type: 'text',
			autoSlugFrom: 'title',
			help: 'Auto-generated from the title. The URL for the project page, or the research article slug to match.'
		},
		{ key: 'order', label: 'Order', type: 'number' }
	],
	researchArticles: [
		{
			key: 'slug',
			label: 'Slug',
			type: 'text',
			required: true,
			autoSlugFrom: 'title',
			help: 'Auto-generated from the title. Must match a project slug.'
		},
		{ key: 'title', label: 'Title', type: 'text', required: true },
		{ key: 'years', label: 'Years', type: 'text' },
		{ key: 'image', label: 'Thumbnail', type: 'image', help: 'Shown on the Research listing cards.' },
		{
			key: 'content',
			label: 'Content',
			type: 'richtext',
			help: 'Write the article. Use the image button to upload, then the alignment buttons to wrap text around it.'
		},
		{
			key: 'relatedPublications',
			label: 'Related publications',
			type: 'references',
			help: 'Search and select publications to list under this article.'
		}
	],
	publications: [
		{
			key: 'type',
			label: 'Type',
			type: 'select',
			options: publicationTypeLabels,
			required: true,
			help: 'Sets the numbering prefix and the section on the website.'
		},
		{ key: 'title', label: 'Title', type: 'text', required: true },
		{ key: 'authors', label: 'Authors', type: 'text', required: true },
		{ key: 'venue', label: 'Venue', type: 'text', required: true },
		{
			key: 'date',
			label: 'Date',
			type: 'text',
			required: true,
			help: 'Used to sort and number publications. Use a sortable format like "2021" or "2021-08" for correct ordering.'
		},
		{ key: 'doi', label: 'DOI', type: 'text' },
		{
			key: 'pdf',
			label: 'PDF',
			type: 'file',
			help: 'Upload a PDF or paste a link.'
		},
		{ key: 'award', label: 'Award', type: 'text', help: 'Optional.' }
	],
	team: [
		{ key: 'name', label: 'Name', type: 'text', required: true },
		{
			key: 'slug',
			label: 'Slug',
			type: 'text',
			help: 'Used in the profile page URL, e.g. "jane-doe". Must be unique.'
		},
		{ key: 'role', label: 'Role', type: 'select', options: ['professor', 'member'], required: true },
		{ key: 'group', label: 'Group heading', type: 'text', help: 'e.g. "Ph.D. Students" or "Alumni".' },
		{ key: 'period', label: 'Period', type: 'text' },
		{ key: 'photo', label: 'Photo', type: 'image' },
		{ key: 'note', label: 'Note', type: 'text' },
		{
			key: 'bio',
			label: 'Bio',
			type: 'richtext',
			help: "Shown on the member's profile page. Optional."
		},
		{ key: 'education', label: 'Education', type: 'stringList', itemLabel: 'Line' },
		{ key: 'email', label: 'Email (without @gmu.edu)', type: 'text' },
		{
			key: 'socials',
			label: 'Social links',
			type: 'objectList',
			itemLabel: 'Link',
			template: { kind: 'scholar', href: '' },
			fields: [
				{ key: 'kind', label: 'Kind', type: 'select', options: socialKinds },
				{ key: 'href', label: 'Link', type: 'url' }
			]
		},
		{ key: 'order', label: 'Order', type: 'number' }
	],
	sponsors: [
		{ key: 'name', label: 'Name', type: 'text', required: true },
		{ key: 'image', label: 'Logo', type: 'image', required: true },
		{ key: 'order', label: 'Order', type: 'number' }
	]
};

export function schemaFor(key: string): Field[] {
	return schemas[key] ?? [];
}

export function slugify(value: unknown): string {
	return String(value ?? '')
		.toLowerCase()
		.trim()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '');
}

export function applyAutoSlugs(fields: Field[], data: Record<string, unknown>): void {
	for (const field of fields) {
		if (field.type === 'text' && field.autoSlugFrom) {
			const current = data[field.key];
			if (typeof current !== 'string' || current.trim() === '') {
				data[field.key] = slugify(data[field.autoSlugFrom]);
			}
		}
	}
}

export function ensureShape(doc: Record<string, unknown>, fields: Field[]): Record<string, unknown> {
	for (const field of fields) {
		const current = doc[field.key];
		if (field.type === 'group') {
			const obj = (current && typeof current === 'object' ? current : {}) as Record<string, unknown>;
			doc[field.key] = ensureShape(obj, field.fields);
		} else if (
			field.type === 'stringList' ||
			field.type === 'references' ||
			field.type === 'mediaList' ||
			field.type === 'members'
		) {
			doc[field.key] = Array.isArray(current) ? current : [];
		} else if (field.type === 'objectList') {
			const list = Array.isArray(current) ? current : [];
			doc[field.key] = list.map((item) =>
				ensureShape((item ?? {}) as Record<string, unknown>, field.fields)
			);
		} else if (field.type === 'number') {
			doc[field.key] = typeof current === 'number' ? current : 0;
		} else if (field.type === 'boolean') {
			doc[field.key] = typeof current === 'boolean' ? current : (field.default ?? false);
		} else if (field.type === 'select') {
			doc[field.key] = typeof current === 'string' && current ? current : field.options[0];
		} else {
			doc[field.key] = typeof current === 'string' ? current : '';
		}
	}
	return doc;
}
