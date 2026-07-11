import { error, redirect, fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import {
	getCollectionMeta,
	getDocument,
	createDocument,
	updateDocument,
	deleteDocument,
	findDocumentBySlug,
	randomSlug
} from '$lib/server/content';
import { templates } from '$lib/templates';
import { schemaFor, applyAutoSlugs } from '$lib/schema';
import { mirrorExternalFile } from '$lib/server/files';
import { logActivity } from '$lib/server/activity';

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
		const fields = schemaFor(params.collection);
		applyAutoSlugs(fields, parsed);

		const hasSlugField = fields.some((field) => field.key === 'slug');
		const slug = typeof parsed.slug === 'string' ? parsed.slug.trim() : '';
		if (hasSlugField && slug) {
			const currentId = params.id === 'new' ? undefined : params.id;
			const conflict = await findDocumentBySlug(params.collection, slug, currentId);
			if (conflict) {
				const confirmed = formData.get('confirmOverwrite') === 'true';
				if (!confirmed) {
					return fail(409, {
						slugConflict: true,
						slug,
						conflictTitle: String(conflict[meta.titleField] ?? '') || '(untitled)'
					});
				}
				await updateDocument(params.collection, conflict.id, { slug: randomSlug() });
			}
		}

		await mirrorFileFields(params.collection, parsed);
		const title = String(parsed[meta.titleField] ?? '') || '(untitled)';
		if (params.id === 'new') {
			const id = await createDocument(params.collection, parsed);
			await logActivity(locals.user.email, 'Created entry', `${meta.label}: ${title}`);
			redirect(303, `/admin/${params.collection}/${id}`);
		}
		await updateDocument(params.collection, params.id, parsed);
		await logActivity(locals.user.email, 'Updated entry', `${meta.label}: ${title}`);
		redirect(303, `/admin/${params.collection}`);
	},
	delete: async ({ params, locals }) => {
		if (!locals.user) {
			redirect(303, '/login');
		}
		if (params.id !== 'new') {
			const meta = getCollectionMeta(params.collection);
			const doc = await getDocument(params.collection, params.id);
			const title = meta && doc ? String(doc[meta.titleField] ?? '') || '(untitled)' : params.id;
			await deleteDocument(params.collection, params.id);
			await logActivity(
				locals.user.email,
				'Deleted entry',
				meta ? `${meta.label}: ${title}` : title
			);
		}
		redirect(303, `/admin/${params.collection}`);
	}
};
