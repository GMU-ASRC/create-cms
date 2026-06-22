import { error, redirect, fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import {
	getCollectionMeta,
	getDocument,
	createDocument,
	updateDocument,
	deleteDocument
} from '$lib/server/content';
import { templates } from '$lib/templates';
import { schemaFor, applyAutoSlugs } from '$lib/schema';
import { mirrorExternalFile } from '$lib/server/files';

async function mirrorFileFields(collection: string, data: Record<string, unknown>): Promise<void> {
	for (const field of schemaFor(collection)) {
		if (field.type !== 'file') continue;
		const value = data[field.key];
		if (typeof value !== 'string') continue;
		const mirrored = await mirrorExternalFile(value);
		if (mirrored) data[field.key] = mirrored;
	}
}

export const load: PageServerLoad = async ({ params, locals }) => {
	if (!locals.user) {
		redirect(303, '/login');
	}
	const meta = getCollectionMeta(params.collection);
	if (!meta) {
		error(404, 'Unknown collection');
	}
	if (params.id === 'new') {
		return { meta, doc: templates[params.collection] ?? {}, isNew: true };
	}
	const doc = await getDocument(params.collection, params.id);
	if (!doc) {
		error(404, 'Not found');
	}
	const { id, ...rest } = doc;
	return { meta, doc: rest, isNew: false };
};

export const actions: Actions = {
	save: async ({ params, request, locals }) => {
		if (!locals.user) {
			redirect(303, '/login');
		}
		const meta = getCollectionMeta(params.collection);
		if (!meta) {
			error(404, 'Unknown collection');
		}
		const formData = await request.formData();
		const raw = String(formData.get('json') ?? '');
		let parsed: Record<string, unknown>;
		try {
			parsed = JSON.parse(raw);
		} catch (parseError) {
			return fail(400, { error: `Invalid JSON: ${(parseError as Error).message}`, json: raw });
		}
		applyAutoSlugs(schemaFor(params.collection), parsed);
		await mirrorFileFields(params.collection, parsed);
		if (params.id === 'new') {
			const id = await createDocument(params.collection, parsed);
			redirect(303, `/admin/${params.collection}/${id}`);
		}
		await updateDocument(params.collection, params.id, parsed);
		redirect(303, `/admin/${params.collection}`);
	},
	delete: async ({ params, locals }) => {
		if (!locals.user) {
			redirect(303, '/login');
		}
		if (params.id !== 'new') {
			await deleteDocument(params.collection, params.id);
		}
		redirect(303, `/admin/${params.collection}`);
	}
};
