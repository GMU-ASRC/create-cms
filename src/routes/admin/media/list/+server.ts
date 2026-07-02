import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { listFiles } from '$lib/server/files';

export const GET: RequestHandler = async ({ locals }) => {
	if (!locals.user) {
		error(401, 'Unauthorized');
	}
	const files = await listFiles();
	const media = files
		.filter((file) => {
			const contentType = file.contentType ?? '';
			return contentType.startsWith('image/') || contentType.startsWith('video/');
		})
		.map((file) => ({
			id: file.id,
			filename: file.filename,
			path: `/api/files/${file.id}`,
			contentType: file.contentType ?? ''
		}));
	return json(media);
};
