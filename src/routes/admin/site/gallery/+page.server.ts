import { redirect, fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { listDocuments, saveGallery } from '$lib/server/content';
import { listFiles } from '$lib/server/files';
import { logActivity } from '$lib/server/activity';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) {
		redirect(303, '/login');
	}
	const docs = await listDocuments('gallery');
	const items = docs.map((doc) => ({
		id: doc.id,
		image: String(doc.image ?? ''),
		title: String(doc.title ?? ''),
		type: String(doc.type ?? '')
	}));
	const media = (await listFiles())
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
	return { items, media };
};

export const actions: Actions = {
	save: async ({ request, locals }) => {
		if (!locals.user) {
			redirect(303, '/login');
		}
		const formData = await request.formData();
		let parsed: unknown;
		try {
			parsed = JSON.parse(String(formData.get('items') ?? '[]'));
		} catch {
			return fail(400, { error: 'Invalid gallery data' });
		}
		const items = (Array.isArray(parsed) ? parsed : [])
			.map((item) => ({
				id: typeof item?.id === 'string' ? item.id : undefined,
				image: String(item?.image ?? ''),
				title: String(item?.title ?? ''),
				type: String(item?.type ?? '')
			}))
			.filter((item) => item.image);
		await saveGallery(items);
		await logActivity(
			locals.user.email,
			'Updated gallery',
			`${items.length} item${items.length === 1 ? '' : 's'}`
		);
		return { success: true };
	}
};
