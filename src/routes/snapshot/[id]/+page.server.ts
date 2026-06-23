import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { getSnapshot } from '$lib/server/snapshots';

export const load: PageServerLoad = async ({ params }) => {
	const snapshot = await getSnapshot(params.id);
	if (!snapshot) {
		error(404, 'Snapshot not found');
	}
	return { snapshot };
};
