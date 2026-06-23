export type ListDisplay = {
	image?: string;
	subtitle?: (doc: Record<string, any>) => string;
	badge?: (doc: Record<string, any>) => string;
	filter?: { field: string; label: string };
	reorderable?: boolean;
};

function plainText(value: unknown): string {
	return typeof value === 'string' ? value.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim() : '';
}

function formatDate(value: unknown): string {
	if (typeof value !== 'string' || !value) return '';
	const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
	return match ? `${match[2]}/${match[3]}/${match[1]}` : value;
}

export const listDisplay: Record<string, ListDisplay> = {
	siteInfo: {
		image: 'logo',
		subtitle: (doc) => doc.institution || ''
	},
	news: {
		subtitle: (doc) => plainText(doc.body),
		badge: (doc) => formatDate(doc.date)
	},
	projects: {
		image: 'image',
		subtitle: (doc) => doc.summary || '',
		badge: (doc) => doc.status || ''
	},
	researchArticles: {
		image: 'image',
		subtitle: (doc) => doc.years || '',
		badge: (doc) => (doc.content ? 'Article' : 'Empty'),
		reorderable: true
	},
	publications: {
		subtitle: (doc) => doc.authors || '',
		badge: (doc) => doc.type || '',
		filter: { field: 'type', label: 'Type' }
	},
	team: {
		image: 'photo',
		subtitle: (doc) => [doc.group, doc.period].filter(Boolean).join('  ·  '),
		badge: (doc) => doc.role || '',
		filter: { field: 'group', label: 'Group' },
		reorderable: true
	},
	sponsors: {
		image: 'image',
		reorderable: true
	},
	gallery: {
		image: 'image',
		reorderable: true
	}
};

export function displayFor(key: string): ListDisplay {
	return listDisplay[key] ?? {};
}
