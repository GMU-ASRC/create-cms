import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { collections } from '$lib/collections';

export const load: PageServerLoad = async ({ locals, url }) => {
	if (!locals.user) {
		redirect(303, '/login');
	}
	return { origin: url.origin, collections };
};
