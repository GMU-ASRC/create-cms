export type PublicationType = {
	label: string;
	prefix: string;
};

export const publicationTypes: PublicationType[] = [
	{ label: 'Journal Articles', prefix: 'J' },
	{ label: 'Conference Proceedings', prefix: 'C' },
	{ label: 'Book Chapters', prefix: 'BC' }
];

export const publicationTypeLabels = publicationTypes.map((type) => type.label);

export type RawPublication = {
	id: string;
	type: string;
	title: string;
	authors: string;
	venue: string;
	date: string;
	doi?: string;
	pdf?: string;
	award?: string;
};

export type TaggedPublication = RawPublication & { tag: string };

function prefixFor(label: string): string {
	return publicationTypes.find((type) => type.label === label)?.prefix ?? '?';
}

export function tagsById(publications: RawPublication[]): Map<string, string> {
	const tags = new Map<string, string>();
	for (const type of publicationTypes) {
		const ofType = publications
			.filter((publication) => publication.type === type.label)
			.sort((first, second) => first.date.localeCompare(second.date));
		ofType.forEach((publication, index) => {
			tags.set(publication.id, `${type.prefix}-${index + 1}`);
		});
	}
	return tags;
}

export function withTags(publications: RawPublication[]): TaggedPublication[] {
	const tags = tagsById(publications);
	return publications.map((publication) => ({
		...publication,
		tag: tags.get(publication.id) ?? prefixFor(publication.type)
	}));
}
