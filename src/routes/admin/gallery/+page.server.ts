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
		title: String(doc.title ?? '')
	}));
	const media = (await listFiles())
		.filter((file) => (file.contentType ?? '').startsWith('image/'))
		.map((file) => ({ id: file.id, filename: file.filename, path: `/api/files/${file.id}` }));
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
				title: String(item?.title ?? '')
			}))
			.filter((item) => item.image);
		await saveGallery(items);
		await logActivity(
			locals.user.email,
			'Updated gallery',
			`${items.length} image${items.length === 1 ? '' : 's'}`
		);
		return { success: true };
	}
};
