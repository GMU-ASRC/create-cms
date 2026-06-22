import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { uploadFile, isAllowedUpload } from '$lib/server/files';

export const POST: RequestHandler = async ({ request, locals }) => {
	if (!locals.user) {
		error(401, 'Unauthorized');
	}
	const form = await request.formData();
	const file = form.get('file');
	if (!(file instanceof File) || file.size === 0) {
		error(400, 'No file provided');
	}
	if (!isAllowedUpload(file.type)) {
		error(400, 'Only image and PDF files are allowed');
	}
	const buffer = Buffer.from(await file.arrayBuffer());
	const id = await uploadFile(file.name, file.type || 'application/octet-stream', buffer);
	return json({ id, path: `/api/files/${id}` });
};
