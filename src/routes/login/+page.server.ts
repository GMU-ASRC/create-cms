import { redirect, fail } from '@sveltejs/kit';
import { dev } from '$app/environment';
import type { Actions, PageServerLoad } from './$types';
import {
	countUsers,
	authenticate,
	createUser,
	createSession,
	SESSION_COOKIE
} from '$lib/server/auth';

function setSessionCookie(
	cookies: import('@sveltejs/kit').Cookies,
	token: string,
	expiresAt: Date
) {
	cookies.set(SESSION_COOKIE, token, {
		path: '/',
		httpOnly: true,
		sameSite: 'lax',
		secure: !dev,
		expires: expiresAt
	});
}

export const load: PageServerLoad = async ({ locals }) => {
	if (locals.user) {
		redirect(303, '/');
	}
	return { needsBootstrap: (await countUsers()) === 0 };
};

export const actions: Actions = {
	login: async ({ request, cookies }) => {
		const data = await request.formData();
		const email = String(data.get('email') ?? '').trim();
		const password = String(data.get('password') ?? '');
		const user = await authenticate(email, password);
		if (!user) {
			return fail(400, { error: 'Invalid email or password', email });
		}
		const { token, expiresAt } = await createSession(user.id);
		setSessionCookie(cookies, token, expiresAt);
		redirect(303, '/');
	},
	register: async ({ request, cookies }) => {
		if ((await countUsers()) > 0) {
			return fail(403, { error: 'Registration is closed. Ask an admin to add you.' });
		}
		const data = await request.formData();
		const email = String(data.get('email') ?? '').trim();
		const password = String(data.get('password') ?? '');
		if (!email || password.length < 8) {
			return fail(400, { error: 'Enter an email and a password of at least 8 characters', email });
		}
		const id = await createUser(email, password);
		const { token, expiresAt } = await createSession(id);
		setSessionCookie(cookies, token, expiresAt);
		redirect(303, '/');
	}
};
