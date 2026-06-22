import { redirect } from '@sveltejs/kit';
import type { Actions } from './$types';
import { deleteSession, SESSION_COOKIE } from '$lib/server/auth';

export const actions: Actions = {
	default: async ({ cookies }) => {
		const token = cookies.get(SESSION_COOKIE);
		await deleteSession(token);
		cookies.delete(SESSION_COOKIE, { path: '/' });
		redirect(303, '/login');
	}
};
