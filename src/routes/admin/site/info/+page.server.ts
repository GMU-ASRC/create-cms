import { redirect, fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { getCollectionMeta, listDocuments, createDocument, updateDocument } from '$lib/server/content';
import { templates } from '$lib/templates';
import { logActivity } from '$lib/server/activity';

const collectionKey = 'siteInfo';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) {
		redirect(303, '/login');
	}
	const meta = getCollectionMeta(collectionKey)!;
	const documents = await listDocuments(collectionKey);
	const existing = documents[0];
	if (existing) {
		const { id, ...rest } = existing;
		return { meta, doc: rest };
	}
	return { meta, doc: templates[collectionKey] ?? {} };
};

export const actions: Actions = {
	save: async ({ request, locals }) => {
		if (!locals.user) {
			redirect(303, '/login');
		}
		const meta = getCollectionMeta(collectionKey)!;
		const formData = await request.formData();
		const raw = String(formData.get('json') ?? '');
		let parsed: Record<string, unknown>;
		try {
			parsed = JSON.parse(raw);
		} catch (parseError) {
			return fail(400, { error: `Invalid JSON: ${(parseError as Error).message}`, json: raw });
		}
		const existing = await listDocuments(collectionKey);
		if (existing[0]) {
			await updateDocument(collectionKey, existing[0].id, parsed);
		} else {
			await createDocument(collectionKey, parsed);
		}
		await logActivity(locals.user.email, 'Updated entry', meta.label);
		redirect(303, '/admin/site/info');
	}
};
