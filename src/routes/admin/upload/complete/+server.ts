import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { registerUploadedFile } from '$lib/server/files';
import { logActivity } from '$lib/server/activity';

export const POST: RequestHandler = async ({ request, locals }) => {
	if (!locals.user) {
		error(401, 'Unauthorized');
	}
	const { key, filename, contentType, size } = await request.json();
	if (typeof key !== 'string' || typeof filename !== 'string' || typeof size !== 'number') {
		error(400, 'Invalid upload details');
	}
	const type = typeof contentType === 'string' && contentType ? contentType : 'application/octet-stream';
	await registerUploadedFile(key, filename, type, size);
	await logActivity(locals.user.email, 'Uploaded media', filename);
	return json({ id: key, path: `/api/files/${key}` });
};
