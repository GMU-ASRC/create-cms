import { redirect, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getLinkUrl } from '$lib/server/links';

export const GET: RequestHandler = async ({ params }) => {
	const url = await getLinkUrl(params.slug);
	if (!url) {
		error(404, 'Link not found');
	}
	redirect(302, url);
};
