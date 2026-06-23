import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getSnapshotHtml } from '$lib/server/snapshots';

export const GET: RequestHandler = async ({ params }) => {
	const html = await getSnapshotHtml(params.id);
	if (!html) {
		error(404, 'Snapshot not found');
	}
	return new Response(new Uint8Array(html), {
		headers: {
			'Content-Type': 'text/html; charset=utf-8',
			'Content-Security-Policy': "script-src 'none'",
			'X-Robots-Tag': 'noindex'
		}
	});
};
