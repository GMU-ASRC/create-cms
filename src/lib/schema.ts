import { publicationTypeLabels } from './publications';

export type FieldCondition = { field: string; equals: string | string[] };

export type Field = { showWhen?: FieldCondition; helpLink?: { url: string; label: string } } & (
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
	| { key: string; label: string; type: 'select'; options: string[]; help?: string; required?: boolean }
	| { key: string; label: string; type: 'stringList'; itemLabel?: string; help?: string; required?: boolean }
	| { key: string; label: string; type: 'references'; help?: string; required?: boolean }
	| { key: string; label: string; type: 'mediaList'; help?: string; required?: boolean }
	| { key: string; label: string; type: 'files'; help?: string; required?: boolean }
	| { key: string; label: string; type: 'author'; help?: string; placeholder?: string; required?: boolean }
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
	  }
);

export function isFieldVisible(field: Field, container: Record<string, unknown>): boolean {
	if (!field.showWhen) return true;
	const current = container[field.showWhen.field];
	return Array.isArray(field.showWhen.equals)
		? field.showWhen.equals.includes(current as string)
		: current === field.showWhen.equals;
}

const socialKinds = ['scholar', 'orcid', 'linkedin', 'researchgate', 'other'];

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
			key: 'alerts',
			label: 'Site alerts',
			type: 'objectList',
			itemLabel: 'Alert',
			template: {
				message: '',
				level: 'info',
				link: '',
				linkText: '',
				dismissible: true,
				active: true
			},
			help: 'Banners shown at the very top of every page.',
			fields: [
				{ key: 'message', label: 'Message', type: 'text', required: true },
				{
					key: 'level',
					label: 'Style',
					type: 'select',
					options: ['info', 'warning', 'success', 'error']
				},
				{ key: 'link', label: 'Link (optional)', type: 'url' },
				{ key: 'linkText', label: 'Link text', type: 'text', placeholder: 'Learn more' },
				{
					key: 'dismissible',
					label: 'Allow visitors to dismiss',
					type: 'boolean',
					default: true,
					help: 'If on, a visitor can close the alert and it stays hidden for them.'
				},
				{
					key: 'active',
					label: 'Active',
					type: 'boolean',
					default: true,
					help: 'Uncheck to hide without deleting.'
				}
			]
		},
		{
			key: 'highlights',
			label: 'Highlights',
			type: 'objectList',
			itemLabel: 'Highlight',
			template: {
				title: '',
				body: '',
				image: '',
				link: '',
				linkText: '',
				location: 'Top of every page',
				active: true
			},
			help: 'Callout boxes shown at a location you choose.',
			fields: [
				{ key: 'title', label: 'Title', type: 'text' },
				{ key: 'body', label: 'Body', type: 'textarea' },
				{ key: 'image', label: 'Image (optional)', type: 'image' },
				{ key: 'link', label: 'Link (optional)', type: 'url' },
				{ key: 'linkText', label: 'Link text', type: 'text', placeholder: 'Learn more' },
				{
					key: 'location',
					label: 'Location',
					type: 'select',
					options: [
						'Top of every page',
						'Bottom of every page',
						'Homepage below hero',
						'Homepage above footer'
					],
					help: 'Where on the site this highlight appears.'
				},
				{
					key: 'active',
					label: 'Active',
					type: 'boolean',
					default: true,
					help: 'Uncheck to hide without deleting.'
				}
			]
		},
		{
			key: 'links',
			label: 'Lab links',
			type: 'objectList',
			itemLabel: 'Link',
			template: { href: '', icon: '' },
			help: 'Links shown in the website footer, such as related labs, the department, or the university.',
			fields: [
				{ key: 'href', label: 'Link', type: 'url' },
				{
					key: 'icon',
					label: 'Icon',
					type: 'text',
					help: 'An Iconify name, e.g. "mdi:github" or "simple-icons:youtube".',
					helpLink: { url: 'https://icon-sets.iconify.design/', label: 'Browse icons' }
				}
			]
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
		{ key: 'author', label: 'Author', type: 'author', help: 'Optional. Start typing to pick a team member, or enter any name. Shown as the byline for this news entry.' },
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
			help: 'Where the "Read more" link points: nowhere, an external URL, or a news page on this site.'
		},
		{
			key: 'href',
			label: 'External link',
			type: 'url',
			showWhen: { field: 'linkType', equals: 'external' },
			help: 'Used when the link is set to external.'
		},
		{
			key: 'slug',
			label: 'Slug',
			type: 'text',
			autoSlugFrom: 'title',
			showWhen: { field: 'linkType', equals: 'article' },
			help: 'Auto-generated from the title. The URL for this news page, e.g. /news/my-update.'
		},
		{
			key: 'gallery',
			label: 'Gallery',
			type: 'mediaList',
			showWhen: { field: 'linkType', equals: 'article' },
			help: 'Additional images shown in a gallery on the news article page.'
		},
		{
			key: 'files',
			label: 'Files',
			type: 'files',
			showWhen: { field: 'linkType', equals: 'article' },
			help: 'Attach documents, datasets, or other downloadable files for this news article.'
		},
		{ key: 'order', label: 'Order', type: 'number' }
	],
	events: [
		{ key: 'title', label: 'Title', type: 'text', required: true },
		{
			key: 'linkType',
			label: 'Card link',
			type: 'select',
			options: ['article', 'external'],
			help: "Where the event card points: an event page on this site, or an external URL."
		},
		{
			key: 'href',
			label: 'External link',
			type: 'url',
			showWhen: { field: 'linkType', equals: 'external' },
			help: 'Used when the card link is set to external.'
		},
		{
			key: 'slug',
			label: 'Slug',
			type: 'text',
			autoSlugFrom: 'title',
			showWhen: { field: 'linkType', equals: 'article' },
			help: 'Auto-generated from the title. The URL for this event page, e.g. /events/my-event. Assigning a slug already used by another event moves that event to a new random slug.'
		},
		{
			key: 'date',
			label: 'Date',
			type: 'date',
			required: true,
			help: 'Start date. Used to sort events and to mark them Upcoming or Past automatically.'
		},
		{ key: 'endDate', label: 'End date', type: 'date', help: 'Optional. For events that span multiple days.' },
		{
			key: 'recurrence',
			label: 'Recurrence',
			type: 'group',
			fields: [
				{
					key: 'frequency',
					label: 'Repeats',
					type: 'select',
					options: ['none', 'daily', 'weekly', 'monthly', 'yearly'],
					help: 'How often this event repeats. Occurrences show up on the events calendar.'
				},
				{
					key: 'interval',
					label: 'Every',
					type: 'number',
					showWhen: { field: 'frequency', equals: ['daily', 'weekly', 'monthly', 'yearly'] },
					help: 'Repeat every N days/weeks/months/years, e.g. 2 = every other week. Defaults to 1.'
				},
				{
					key: 'until',
					label: 'Repeat until',
					type: 'date',
					showWhen: { field: 'frequency', equals: ['daily', 'weekly', 'monthly', 'yearly'] },
					help: 'Last date a repeat can fall on. Leave blank to repeat indefinitely.'
				}
			]
		},
		{
			key: 'location',
			label: 'Location',
			type: 'text',
			showWhen: { field: 'linkType', equals: 'article' },
			help: 'e.g. "Fairfax, VA" or "Online".'
		},
		{
			key: 'summary',
			label: 'Summary',
			type: 'richtext',
			showWhen: { field: 'linkType', equals: 'article' },
			help: 'Short description shown on the event card and at the top of the event page.'
		},
		{
			key: 'image',
			label: 'Image',
			type: 'image',
			help: 'Thumbnail shown on the event card, and the main image on the event page.'
		},
		{
			key: 'content',
			label: 'Page content',
			type: 'richtext',
			showWhen: { field: 'linkType', equals: 'article' },
			help: 'The main write-up shown on the event page. Supports formatting, links, and images.'
		},
		{
			key: 'tags',
			label: 'Tags',
			type: 'stringList',
			itemLabel: 'Tag',
			showWhen: { field: 'linkType', equals: 'article' },
			help: 'Keywords or topics shown as chips on the event page.'
		},
		{
			key: 'teamMembers',
			label: 'Team members',
			type: 'members',
			showWhen: { field: 'linkType', equals: 'article' },
			help: 'Search and select people from the Team page. You can also type a name and press Enter for outside participants.'
		},
		{
			key: 'links',
			label: 'Resource links',
			type: 'objectList',
			itemLabel: 'Link',
			template: { label: '', href: '' },
			showWhen: { field: 'linkType', equals: 'article' },
			help: 'External resources such as registration, schedules, or recordings.',
			fields: [
				{ key: 'label', label: 'Label', type: 'text' },
				{ key: 'href', label: 'URL', type: 'url' }
			]
		},
		{
			key: 'gallery',
			label: 'Gallery',
			type: 'mediaList',
			showWhen: { field: 'linkType', equals: 'article' },
			help: 'Additional images shown in a gallery on the event page.'
		},
		{
			key: 'files',
			label: 'Files',
			type: 'files',
			showWhen: { field: 'linkType', equals: 'article' },
			help: 'Attach documents, datasets, or other downloadable files for this event.'
		}
	],
	projects: [
		{ key: 'title', label: 'Title', type: 'text', required: true },
		{
			key: 'summary',
			label: 'Summary',
			type: 'richtext',
			help: 'Short description shown on the project card and at the top of the project page.'
		},
		{
			key: 'years',
			label: 'Timeline',
			type: 'text',
			help: 'Shown on the project card and page, e.g. "2023-Present" or "2019-2022".'
		},
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
			key: 'files',
			label: 'Files',
			type: 'files',
			help: 'Attach documents, datasets, or other downloadable files for this project.'
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
		{ key: 'author', label: 'Author', type: 'author', help: 'Optional. Start typing to pick a team member, or enter any name. Shown as the byline for this article.' },
		{ key: 'status', label: 'Status', type: 'select', options: ['Active', 'Completed'] },
		{ key: 'image', label: 'Thumbnail', type: 'image', help: 'Shown on the Research listing cards.' },
		{
			key: 'content',
			label: 'Content',
			type: 'richtext',
			help: 'Write the article. Use the image button to upload, then the alignment buttons to wrap text around it.'
		},
		{
			key: 'gallery',
			label: 'Gallery',
			type: 'mediaList',
			help: 'Additional images shown in a gallery on the research article page.'
		},
		{
			key: 'files',
			label: 'Files',
			type: 'files',
			help: 'Attach documents, datasets, or other downloadable files for this article.'
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
			autoSlugFrom: 'name',
			help: 'Auto-generated from the name and used in the profile page URL, e.g. "jane-doe". Must be unique.'
		},
		{ key: 'role', label: 'Role', type: 'select', options: ['professor', 'member'], required: true },
		{ key: 'group', label: 'Group heading', type: 'text', help: 'e.g. "Ph.D. Students" or "Alumni".' },
		{ key: 'period', label: 'Period', type: 'text' },
		{ key: 'areaOfStudy', label: 'Area of Study', type: 'text', help: 'e.g. "Computer Engineering". Optional.' },
		{ key: 'photo', label: 'Photo', type: 'image' },
		{ key: 'note', label: 'Note', type: 'text' },
		{
			key: 'bio',
			label: 'Bio',
			type: 'richtext',
			help: "Shown on the member's profile page. Optional."
		},
		{
			key: 'education',
			label: 'Education',
			type: 'objectList',
			itemLabel: 'Degree',
			template: { degree: '', institution: '', years: '' },
			help: 'Each entry shows on the website as the degree, the institution, and the years.',
			fields: [
				{ key: 'degree', label: 'Degree', type: 'text', placeholder: 'e.g. B.S., Electrical Engineering' },
				{ key: 'institution', label: 'Institution', type: 'text', placeholder: 'e.g. George Mason University' },
				{ key: 'years', label: 'Years', type: 'text', placeholder: 'e.g. 2021 or 2018 - 2023' }
			]
		},
		{ key: 'email', label: 'Email (without @gmu.edu)', type: 'text' },
		{
			key: 'socials',
			label: 'Social links',
			type: 'objectList',
			itemLabel: 'Link',
			template: { kind: 'scholar', href: '', icon: '' },
			fields: [
				{ key: 'kind', label: 'Kind', type: 'select', options: socialKinds },
				{ key: 'href', label: 'Link', type: 'url' },
				{
					key: 'icon',
					label: 'Icon',
					type: 'text',
					showWhen: { field: 'kind', equals: 'other' },
					help: 'An Iconify name, e.g. "mdi:github" or "simple-icons:youtube".',
					helpLink: { url: 'https://icon-sets.iconify.design/', label: 'Browse icons' }
				}
			]
		},
		{ key: 'order', label: 'Order', type: 'number' }
	],
	sponsors: [
		{ key: 'name', label: 'Name', type: 'text', required: true },
		{ key: 'image', label: 'Logo', type: 'image', required: true },
		{ key: 'order', label: 'Order', type: 'number' }
	],
	gallery: [
		{ key: 'title', label: 'Title', type: 'text', help: 'Optional caption shown under the image.' },
		{ key: 'image', label: 'Image', type: 'image', required: true },
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
		if (field.type === 'text' && field.autoSlugFrom && isFieldVisible(field, data)) {
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
			field.type === 'files' ||
			field.type === 'members'
		) {
			doc[field.key] = Array.isArray(current) ? current : [];
		} else if (field.type === 'objectList') {
			const list = Array.isArray(current) ? current : [];
			const firstFieldKey = field.fields[0]?.key;
			doc[field.key] = list.map((item) => {
				if (typeof item === 'string' && firstFieldKey) {
					return ensureShape({ [firstFieldKey]: item }, field.fields);
				}
				return ensureShape((item ?? {}) as Record<string, unknown>, field.fields);
			});
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
