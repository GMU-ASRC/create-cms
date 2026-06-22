import { error, redirect, fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import {
	getCollectionMeta,
	listDocuments,
	createDocument,
	updateDocument,
	reorderDocuments
} from '$lib/server/content';
import { templates } from '$lib/templates';
import { schemaFor } from '$lib/schema';
import { mirrorExternalFileResult } from '$lib/server/files';
import { tagsById, type RawPublication } from '$lib/publications';

export const load: PageServerLoad = async ({ params, locals }) => {
	if (!locals.user) {
		redirect(303, '/login');
	}
	const meta = getCollectionMeta(params.collection);
	if (!meta) {
		error(404, 'Unknown collection');
	}
	let documents = await listDocuments(params.collection);
	if (params.collection === 'publications') {
		const tags = tagsById(documents as unknown as RawPublication[]);
		documents = documents.map((doc) => ({ ...doc, tag: tags.get(doc.id) ?? '' }));
	}
	if (meta.singleton) {
		const existing = documents[0];
		if (existing) {
			const { id, ...rest } = existing;
			return { meta, documents, doc: rest };
		}
		return { meta, documents, doc: templates[params.collection] ?? {} };
	}
	return { meta, documents };
};

export const actions: Actions = {
	save: async ({ params, request, locals }) => {
		if (!locals.user) {
			redirect(303, '/login');
		}
		const meta = getCollectionMeta(params.collection);
		if (!meta || !meta.singleton) {
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
		const existing = await listDocuments(params.collection);
		if (existing[0]) {
			await updateDocument(params.collection, existing[0].id, parsed);
		} else {
			await createDocument(params.collection, parsed);
		}
		redirect(303, `/admin/${params.collection}`);
	},
	mirrorPdfs: async ({ params, locals }) => {
		if (!locals.user) {
			redirect(303, '/login');
		}
		const meta = getCollectionMeta(params.collection);
		if (!meta) {
			error(404, 'Unknown collection');
		}
		const fileFields = schemaFor(params.collection).filter((field) => field.type === 'file');
		if (fileFields.length === 0) {
			return { mirrored: 0, failed: 0 };
		}
		const documents = await listDocuments(params.collection);
		const delayBetweenDownloads = 1500;
		const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
		let mirrored = 0;
		let downloads = 0;
		const failures: Array<{ title: string; reason: string }> = [];
		console.log(`[mirror] starting bulk download for ${documents.length} ${params.collection}`);
		for (const doc of documents) {
			const updates: Record<string, unknown> = {};
			for (const field of fileFields) {
				const value = doc[field.key];
				if (typeof value !== 'string') continue;
				if (!/^https?:\/\//i.test(value) || value.includes('/api/files/')) continue;
				if (downloads > 0) await wait(delayBetweenDownloads);
				downloads++;
				const result = await mirrorExternalFileResult(value);
				if (result.ok) {
					updates[field.key] = result.path;
				} else {
					failures.push({ title: String(doc[meta.titleField] ?? value), reason: result.reason });
				}
			}
			if (Object.keys(updates).length > 0) {
				await updateDocument(params.collection, doc.id, updates);
				mirrored += Object.keys(updates).length;
			}
		}
		console.log(`[mirror] done: ${mirrored} stored, ${failures.length} failed`);
		return { mirrored, failed: failures.length, failures };
	},
	reorder: async ({ params, request, locals }) => {
		if (!locals.user) {
			redirect(303, '/login');
		}
		const meta = getCollectionMeta(params.collection);
		if (!meta) {
			error(404, 'Unknown collection');
		}
		const formData = await request.formData();
		const ids = String(formData.get('ids') ?? '')
			.split(',')
			.filter(Boolean);
		await reorderDocuments(params.collection, ids);
		return { reordered: true };
	}
};
