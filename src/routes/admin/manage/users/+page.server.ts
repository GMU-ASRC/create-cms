import { redirect, fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { listUsers, createUser, deleteUser } from '$lib/server/auth';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) {
		redirect(303, '/login');
	}
	return { users: await listUsers(), currentUserId: locals.user.id };
};

export const actions: Actions = {
	create: async ({ request, locals }) => {
		if (!locals.user) {
			redirect(303, '/login');
		}
		const formData = await request.formData();
		const email = String(formData.get('email') ?? '').trim();
		const password = String(formData.get('password') ?? '');
		if (!email || password.length < 8) {
			return fail(400, { error: 'Enter an email and a password of at least 8 characters' });
		}
		try {
			await createUser(email, password);
		} catch (createError) {
			return fail(400, { error: (createError as Error).message });
		}
		return { success: true };
	},
	delete: async ({ request, locals }) => {
		if (!locals.user) {
			redirect(303, '/login');
		}
		const formData = await request.formData();
		const id = String(formData.get('id') ?? '');
		if (id && id !== locals.user.id) {
			await deleteUser(id);
		}
		return { success: true };
	}
};
