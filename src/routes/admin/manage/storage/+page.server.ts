import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { getStorageStats } from '$lib/server/storage';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) {
		redirect(303, '/login');
	}
	try {
		const stats = await getStorageStats();
		return { stats, error: null };
	} catch (statsError) {
		return { stats: null, error: (statsError as Error).message };
	}
};
