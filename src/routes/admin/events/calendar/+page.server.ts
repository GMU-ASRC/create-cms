import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { listDocuments } from '$lib/server/content';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) {
		redirect(303, '/login');
	}
	const events = await listDocuments('events');
	return { events };
};
