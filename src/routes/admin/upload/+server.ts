import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { uploadFile, isAllowedUpload } from '$lib/server/files';
import { assertStorageLimit } from '$lib/server/storage';
import { logActivity } from '$lib/server/activity';

export const POST: RequestHandler = async ({ request, locals }) => {
	if (!locals.user) {
		error(401, 'Unauthorized');
	}
	const form = await request.formData();
	const file = form.get('file');
	if (!(file instanceof File) || file.size === 0) {
		error(400, 'No file provided');
	}
	if (!isAllowedUpload(file.type, file.name)) {
		error(400, 'This file type is not allowed');
	}
	try {
		await assertStorageLimit(file.size);
	} catch (limitError) {
		error(413, (limitError as Error).message);
	}
	const buffer = Buffer.from(await file.arrayBuffer());
	const id = await uploadFile(file.name, file.type || 'application/octet-stream', buffer);
	await logActivity(locals.user.email, 'Uploaded media', file.name);
	return json({ id, path: `/api/files/${id}` });
};
