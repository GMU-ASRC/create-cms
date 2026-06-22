import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getFile } from '$lib/server/files';
import { corsHeaders } from '$lib/server/cors';

export const OPTIONS: RequestHandler = async () => {
	return new Response(null, { headers: corsHeaders() });
};

export const GET: RequestHandler = async ({ params }) => {
	const file = await getFile(params.id);
	if (!file) {
		error(404, 'File not found');
	}
	return new Response(new Uint8Array(file.data), {
		headers: {
			...corsHeaders(),
			'Content-Type': file.contentType,
			'Cache-Control': 'public, max-age=31536000, immutable'
		}
	});
};
