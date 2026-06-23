import { redirect, fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { listFiles, uploadFile, deleteFile, isAllowedUpload } from '$lib/server/files';
import { usedFileIds } from '$lib/server/content';
import { listLinks, createLink, deleteLink } from '$lib/server/links';
import { captureSnapshot, listSnapshots, deleteSnapshot } from '$lib/server/snapshots';
import { logActivity } from '$lib/server/activity';

export const config = { maxDuration: 60 };

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) {
		redirect(303, '/login');
	}
	const [files, used, links, snapshots] = await Promise.all([
		listFiles(),
		usedFileIds(),
		listLinks(),
		listSnapshots()
	]);
	return { files: files.map((file) => ({ ...file, used: used.has(file.id) })), links, snapshots };
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
	},
	createLink: async ({ request, locals }) => {
		if (!locals.user) {
			redirect(303, '/login');
		}
		const formData = await request.formData();
		const slug = String(formData.get('slug') ?? '').trim();
		let url = String(formData.get('url') ?? '').trim();
		if (!url) {
			return fail(400, { linkError: 'Enter a URL to redirect to' });
		}
		if (!/^https?:\/\//i.test(url)) {
			url = `https://${url}`;
		}
		if (slug && !/^[a-zA-Z0-9-]+$/.test(slug)) {
			return fail(400, { linkError: 'Short code can only contain letters, numbers, and hyphens' });
		}
		let finalSlug: string;
		try {
			finalSlug = await createLink(slug, url);
		} catch (linkError) {
			return fail(400, { linkError: (linkError as Error).message });
		}
		await logActivity(locals.user.email, 'Created link', `${finalSlug} -> ${url}`);
		return { linkSuccess: true };
	},
	deleteLink: async ({ request, locals }) => {
		if (!locals.user) {
			redirect(303, '/login');
		}
		const formData = await request.formData();
		const id = String(formData.get('id') ?? '');
		if (id) {
			await deleteLink(id);
			await logActivity(locals.user.email, 'Deleted link', id);
		}
		return { success: true };
	},
	capture: async ({ request, locals }) => {
		if (!locals.user) {
			redirect(303, '/login');
		}
		const formData = await request.formData();
		const url = String(formData.get('url') ?? '').trim();
		if (!url) {
			return fail(400, { snapshotError: 'Enter a URL to archive' });
		}
		let snapshot;
		try {
			snapshot = await captureSnapshot(url);
		} catch (captureError) {
			return fail(400, { snapshotError: (captureError as Error).message });
		}
		await logActivity(locals.user.email, 'Captured snapshot', snapshot.url);
		return { snapshotSuccess: true };
	},
	deleteSnapshot: async ({ request, locals }) => {
		if (!locals.user) {
			redirect(303, '/login');
		}
		const formData = await request.formData();
		const id = String(formData.get('id') ?? '');
		if (id) {
			await deleteSnapshot(id);
			await logActivity(locals.user.email, 'Deleted snapshot', id);
		}
		return { success: true };
	}
};
