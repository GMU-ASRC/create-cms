import { listDocuments, updateDocument } from './content';
import {
	numbersById,
	parsePublicationNumber,
	prefixFor,
	type RawPublication
} from '$lib/publications';

export async function publicationNumberFor(id: string): Promise<number> {
	const publications = (await listDocuments('publications')) as unknown as RawPublication[];
	return numbersById(publications).get(id) ?? 0;
}

export async function applyPublicationNumber(
	id: string | null,
	data: Record<string, unknown>
): Promise<string | null> {
	const publications = (await listDocuments('publications')) as unknown as RawPublication[];
	const numbers = numbersById(publications);
	const current = publications.find((publication) => publication.id === id);
	const otherPublications = publications.filter((publication) => publication.id !== id);
	const sameType = otherPublications.filter((publication) => publication.type === data.type);

	const previousNumber = current && current.type === data.type ? numbers.get(current.id) : undefined;
	const highestNumber = Math.max(0, ...sameType.map((publication) => numbers.get(publication.id) ?? 0));
	const finalNumber = parsePublicationNumber(data.number) || previousNumber || highestNumber + 1;

	const holder = sameType.find((publication) => numbers.get(publication.id) === finalNumber);
	if (holder) {
		if (!previousNumber) {
			const tag = `${prefixFor(String(data.type))}-${finalNumber}`;
			return `${tag} is already used by "${holder.title}". Choose another number or leave it as 0.`;
		}
		numbers.set(holder.id, previousNumber);
	}

	data.number = finalNumber;
	for (const publication of otherPublications) {
		const effectiveNumber = numbers.get(publication.id);
		if (effectiveNumber && parsePublicationNumber(publication.number) !== effectiveNumber) {
			await updateDocument('publications', publication.id, { number: effectiveNumber });
		}
	}
	return null;
}
