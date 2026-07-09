import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getFileUrl } from '$lib/server/files';
import { corsHeaders } from '$lib/server/cors';

export const OPTIONS: RequestHandler = async () => {
	return new Response(null, { headers: corsHeaders() });
};

export const GET: RequestHandler = async ({ params }) => {
	const url = await getFileUrl(params.id);
	if (!url) {
		error(404, 'File not found');
	}
	return new Response(null, {
		status: 302,
		headers: {
			...corsHeaders(),
			Location: url,
			'Cache-Control': 'public, max-age=1800'
		}
	});
};
