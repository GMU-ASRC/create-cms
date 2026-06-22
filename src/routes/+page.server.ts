import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { collections, listDocuments } from '$lib/server/content';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) {
		redirect(303, '/login');
	}
	const counts = await Promise.all(
		collections.map(async (collection) => ({
			key: collection.key,
			label: collection.label,
			singleton: collection.singleton ?? false,
			count: (await listDocuments(collection.key)).length
		}))
	);
	return { counts };
};
