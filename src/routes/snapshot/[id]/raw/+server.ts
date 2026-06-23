import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getSnapshotFile } from '$lib/server/snapshots';

export const GET: RequestHandler = async ({ params }) => {
	const file = await getSnapshotFile(params.id);
	if (!file) {
		error(404, 'Snapshot not found');
	}
	const headers: Record<string, string> = {
		'Content-Type': file.contentType,
		'X-Robots-Tag': 'noindex'
	};
	if (/text\/html/i.test(file.contentType)) {
		headers['Content-Security-Policy'] = "script-src 'none'";
	}
	return new Response(new Uint8Array(file.buffer), { headers });
};
