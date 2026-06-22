import { redirect, fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { listFiles, uploadFile, deleteFile, isAllowedUpload } from '$lib/server/files';
import { usedFileIds } from '$lib/server/content';
import { logActivity } from '$lib/server/activity';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) {
		redirect(303, '/login');
	}
	const [files, used] = await Promise.all([listFiles(), usedFileIds()]);
	return { files: files.map((file) => ({ ...file, used: used.has(file.id) })) };
};

export const actions: Actions = {
	upload: async ({ request, locals }) => {
		if (!locals.user) {
			redirect(303, '/login');
		}
		const formData = await request.formData();
		const file = formData.get('file');
		if (!(file instanceof File) || file.size === 0) {
			return fail(400, { error: 'Choose a file to upload' });
		}
		if (!isAllowedUpload(file.type)) {
			return fail(400, { error: 'Only image and PDF files are allowed' });
		}
		const buffer = Buffer.from(await file.arrayBuffer());
		await uploadFile(file.name, file.type || 'application/octet-stream', buffer);
		await logActivity(locals.user.email, 'Uploaded media', file.name);
		return { success: true };
	},
	delete: async ({ request, locals }) => {
		if (!locals.user) {
			redirect(303, '/login');
		}
		const formData = await request.formData();
		const id = String(formData.get('id') ?? '');
		if (id) {
			await deleteFile(id);
			await logActivity(locals.user.email, 'Deleted media', id);
		}
		return { success: true };
	}
};
