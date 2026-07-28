import { redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { getCollectionMeta, listDocuments, reorderDocuments } from '$lib/server/content';
import { logActivity } from '$lib/server/activity';

const collectionKey = 'sponsors';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) {
		redirect(303, '/login');
	}
	const meta = getCollectionMeta(collectionKey)!;
	const documents = await listDocuments(collectionKey);
	return { meta, documents };
};

export const actions: Actions = {
	reorder: async ({ request, locals }) => {
		if (!locals.user) {
			redirect(303, '/login');
		}
		const meta = getCollectionMeta(collectionKey)!;
		const formData = await request.formData();
		const ids = String(formData.get('ids') ?? '')
			.split(',')
			.filter(Boolean);
		await reorderDocuments(collectionKey, ids);
		await logActivity(locals.user.email, 'Reordered entries', meta.label);
		return { reordered: true };
	}
};
