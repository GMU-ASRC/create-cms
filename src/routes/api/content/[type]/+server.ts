import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getCollectionMeta, listDocuments } from '$lib/server/content';
import { corsHeaders } from '$lib/server/cors';

export const OPTIONS: RequestHandler = async () => {
	return new Response(null, { headers: corsHeaders() });
};

export const GET: RequestHandler = async ({ params }) => {
	const meta = getCollectionMeta(params.type);
	if (!meta) {
		error(404, 'Unknown content type');
	}
	const documents = await listDocuments(params.type);
	const body = meta.singleton ? (documents[0] ?? null) : documents;
	return json(body, { headers: corsHeaders() });
};
