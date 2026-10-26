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
	number?: number;
};

export type TaggedPublication = RawPublication & { tag: string };

export function prefixFor(label: string): string {
	return publicationTypes.find((type) => type.label === label)?.prefix ?? '?';
}

export function parsePublicationNumber(value: unknown): number {
	const parsed = Number(value);
	return Number.isInteger(parsed) && parsed > 0 ? parsed : 0;
}

export function numbersById(publications: RawPublication[]): Map<string, number> {
	const numbers = new Map<string, number>();
	for (const type of publicationTypes) {
		const ofType = publications
			.filter((publication) => publication.type === type.label)
			.sort((first, second) => (first.date ?? '').localeCompare(second.date ?? ''));
		const storedNumbers = ofType.map((publication) => parsePublicationNumber(publication.number));
		let nextNumber = Math.max(0, ...storedNumbers) + 1;
		ofType.forEach((publication, index) => {
			numbers.set(publication.id, storedNumbers[index] || nextNumber++);
		});
	}
	return numbers;
}

export function tagsById(publications: RawPublication[]): Map<string, string> {
	const numbers = numbersById(publications);
	const tags = new Map<string, string>();
	for (const publication of publications) {
		const number = numbers.get(publication.id);
		if (number) tags.set(publication.id, `${prefixFor(publication.type)}-${number}`);
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
