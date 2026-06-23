import { redirect, fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { listFiles, uploadFile, deleteFile, isAllowedUpload } from '$lib/server/files';
import { usedFileIds } from '$lib/server/content';
import { listLinks, createLink, deleteLink } from '$lib/server/links';
import {
	captureSnapshot,
	saveUploadedSnapshot,
	saveUploadedFileSnapshot,
	listSnapshots,
	deleteSnapshot
} from '$lib/server/snapshots';
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
	uploadSnapshot: async ({ request, locals }) => {
		if (!locals.user) {
			redirect(303, '/login');
		}
		const formData = await request.formData();
		const file = formData.get('snapshotFile');
		if (!(file instanceof File) || file.size === 0) {
			return fail(400, { snapshotError: 'Choose a file to upload' });
		}
		if (file.size > 25_000_000) {
			return fail(400, { snapshotError: 'The file is too large (max 25 MB)' });
		}
		const isHtml = /text\/html/i.test(file.type) || /\.html?$/i.test(file.name);
		const isImage = file.type.startsWith('image/');
		const isPdf = file.type === 'application/pdf' || /\.pdf$/i.test(file.name);
		let snapshot;
		try {
			if (isHtml) {
				snapshot = await saveUploadedSnapshot(file.name, await file.text());
			} else if (isImage || isPdf) {
				const buffer = Buffer.from(await file.arrayBuffer());
				const contentType = file.type || (isPdf ? 'application/pdf' : 'application/octet-stream');
				snapshot = await saveUploadedFileSnapshot(file.name, buffer, contentType);
			} else {
				return fail(400, { snapshotError: 'Only HTML, image, and PDF files are allowed' });
			}
		} catch (uploadError) {
			return fail(400, { snapshotError: (uploadError as Error).message });
		}
		await logActivity(locals.user.email, 'Uploaded snapshot', snapshot.title);
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
