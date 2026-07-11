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

function dayNumber(value: unknown): number | null {
	if (typeof value !== 'string') return null;
	const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value.trim());
	if (!match) return null;
	return Number(match[1]) * 10000 + Number(match[2]) * 100 + Number(match[3]);
}

function eventStatus(doc: Record<string, any>): string {
	const start = dayNumber(doc.date);
	if (start === null) return '';
	const end = dayNumber(doc.endDate) ?? start;
	const now = new Date();
	const today = now.getFullYear() * 10000 + (now.getMonth() + 1) * 100 + now.getDate();
	if (today < start) return 'Upcoming';
	if (today > end) return 'Past';
	return 'Ongoing';
}

function eventRange(doc: Record<string, any>): string {
	const start = formatDate(doc.date);
	const end = formatDate(doc.endDate);
	if (!start) return '';
	return end && end !== start ? `${start} - ${end}` : start;
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
	events: {
		image: 'image',
		subtitle: (doc) =>
			[
				doc.slug ? `/${doc.slug}` : '',
				eventRange(doc),
				doc.location,
				doc.linkType === 'external' ? 'External link' : '',
				plainText(doc.summary)
			]
				.filter(Boolean)
				.join('  ·  '),
		badge: (doc) => eventStatus(doc),
		filter: { field: 'linkType', label: 'Type' }
	},
	projects: {
		image: 'image',
		subtitle: (doc) => doc.summary || '',
		badge: (doc) => doc.status || '',
		reorderable: true
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
