import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { listFiles } from '$lib/server/files';
import { listDocuments } from '$lib/server/content';

async function publicationPdfIds(): Promise<Set<string>> {
	const ids = new Set<string>();
	const publications = await listDocuments('publications');
	for (const publication of publications) {
		const pdf = typeof publication.pdf === 'string' ? publication.pdf : '';
		const match = pdf.match(/\/api\/files\/([a-zA-Z0-9._-]+)/);
		if (match) ids.add(match[1]);
	}
	return ids;
}

export const GET: RequestHandler = async ({ locals }) => {
	if (!locals.user) {
		error(401, 'Unauthorized');
	}
	const [files, publicationIds] = await Promise.all([listFiles(), publicationPdfIds()]);
	const media = files
		.filter((file) => {
			const contentType = file.contentType ?? '';
			if (contentType.startsWith('image/') || contentType.startsWith('video/')) return false;
			return !publicationIds.has(file.id);
		})
		.map((file) => ({
			id: file.id,
			filename: file.filename,
			path: `/api/files/${file.id}`,
			contentType: file.contentType ?? ''
		}));
	return json(media);
};
