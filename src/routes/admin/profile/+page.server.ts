import { redirect, fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { getUser, updateEmail, changePassword } from '$lib/server/auth';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) {
		redirect(303, '/login');
	}
	const user = await getUser(locals.user.id);
	return { email: user?.email ?? locals.user.email, createdAt: user?.createdAt ?? null };
};

export const actions: Actions = {
	email: async ({ request, locals }) => {
		if (!locals.user) {
			redirect(303, '/login');
		}
		const formData = await request.formData();
		const email = String(formData.get('email') ?? '').trim();
		if (!email) {
			return fail(400, { section: 'email', error: 'Enter an email address' });
		}
		try {
			await updateEmail(locals.user.id, email);
		} catch (updateError) {
			return fail(400, { section: 'email', error: (updateError as Error).message });
		}
		return { section: 'email', success: true };
	},
	password: async ({ request, locals }) => {
		if (!locals.user) {
			redirect(303, '/login');
		}
		const formData = await request.formData();
		const currentPassword = String(formData.get('currentPassword') ?? '');
		const newPassword = String(formData.get('newPassword') ?? '');
		const confirmPassword = String(formData.get('confirmPassword') ?? '');
		if (newPassword.length < 8) {
			return fail(400, { section: 'password', error: 'New password must be at least 8 characters' });
		}
		if (newPassword !== confirmPassword) {
			return fail(400, { section: 'password', error: 'New passwords do not match' });
		}
		try {
			await changePassword(locals.user.id, currentPassword, newPassword);
		} catch (updateError) {
			return fail(400, { section: 'password', error: (updateError as Error).message });
		}
		return { section: 'password', success: true };
	}
};
