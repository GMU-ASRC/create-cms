import { ObjectId } from 'mongodb';
import { randomBytes } from 'node:crypto';
import { getDb } from './db';
import { collections } from '$lib/collections';
export { collections, getCollectionMeta } from '$lib/collections';

type Document = Record<string, unknown> & { id: string };

export async function usedFileIds(): Promise<Set<string>> {
	const ids = new Set<string>();
	for (const collection of collections) {
		const docs = await listDocuments(collection.key);
		for (const doc of docs) {
			const json = JSON.stringify(doc);
			for (const match of json.matchAll(/\/api\/files\/([a-zA-Z0-9._-]+)/g)) {
				ids.add(match[1]);
			}
		}
	}
	return ids;
}

function serialize(doc: Record<string, unknown>): Document {
	const { _id, ...rest } = doc;
	return { id: (_id as ObjectId).toString(), ...rest };
}

function eventDayNumber(value: unknown): number | null {
	if (typeof value !== 'string' || !value.trim()) return null;
	const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value.trim());
	if (!match) return null;
	return Number(match[1]) * 10000 + Number(match[2]) * 100 + Number(match[3]);
}

function eventIsPast(doc: Record<string, unknown>): boolean {
	const start = eventDayNumber(doc.date);
	if (start === null) return false;
	const end = eventDayNumber(doc.endDate) ?? start;
	const now = new Date();
	const today = now.getFullYear() * 10000 + (now.getMonth() + 1) * 100 + now.getDate();
	return today > end;
}

function compareEvents(first: Document, second: Document): number {
	const firstPast = eventIsPast(first);
	const secondPast = eventIsPast(second);
	if (firstPast !== secondPast) return firstPast ? 1 : -1;
	const firstTime = Date.parse(String(first.date ?? ''));
	const secondTime = Date.parse(String(second.date ?? ''));
	const firstValue = Number.isNaN(firstTime) ? Number.POSITIVE_INFINITY : firstTime;
	const secondValue = Number.isNaN(secondTime) ? Number.POSITIVE_INFINITY : secondTime;
	return firstPast ? secondValue - firstValue : firstValue - secondValue;
}

export async function listDocuments(key: string): Promise<Document[]> {
	const db = await getDb();
	if (key === 'events') {
		const docs = await db.collection(key).find({}).toArray();
		return docs.map(serialize).sort(compareEvents);
	}
	const meta = collections.find((collection) => collection.key === key);
	if (meta?.sortBy) {
		const docs = await db
			.collection(key)
			.aggregate([{ $sort: { [meta.sortBy.field]: meta.sortBy.direction, _id: -1 } }])
			.toArray();
		return docs.map(serialize);
	}
	const docs = await db
		.collection(key)
		.aggregate([
			{ $addFields: { __order: { $ifNull: ['$order', Number.MAX_SAFE_INTEGER] } } },
			{ $sort: { __order: 1, _id: 1 } },
			{ $project: { __order: 0 } }
		])
		.toArray();
	return docs.map(serialize);
}

export async function getDocument(key: string, id: string): Promise<Document | null> {
	const db = await getDb();
	const doc = await db.collection(key).findOne({ _id: new ObjectId(id) });
	return doc ? serialize(doc) : null;
}

export async function findDocumentBySlug(
	key: string,
	slug: string,
	excludeId?: string
): Promise<Document | null> {
	const db = await getDb();
	const query: Record<string, unknown> = { slug };
	if (excludeId) query._id = { $ne: new ObjectId(excludeId) };
	const doc = await db.collection(key).findOne(query);
	return doc ? serialize(doc) : null;
}

export function randomSlug(length = 8): string {
	return randomBytes(16)
		.toString('base64')
		.replace(/[^a-zA-Z0-9]/g, '')
		.toLowerCase()
		.slice(0, length);
}

export async function createDocument(key: string, data: Record<string, unknown>): Promise<string> {
	const db = await getDb();
	delete data.id;
	delete data._id;
	if (typeof data.order === 'number') {
		await db
			.collection(key)
			.updateMany({ order: { $gte: data.order } }, { $inc: { order: 1 } });
	} else {
		const lowest = await db
			.collection(key)
			.find({ order: { $type: 'number' } })
			.sort({ order: 1 })
			.limit(1)
			.toArray();
		const minOrder = lowest.length ? (lowest[0].order as number) : 0;
		data.order = minOrder - 1;
	}
	const result = await db.collection(key).insertOne(data);
	return result.insertedId.toString();
}

export async function updateDocument(
	key: string,
	id: string,
	data: Record<string, unknown>
): Promise<void> {
	const db = await getDb();
	delete data.id;
	delete data._id;
	await db.collection(key).updateOne({ _id: new ObjectId(id) }, { $set: data });
}

export async function deleteDocument(key: string, id: string): Promise<void> {
	const db = await getDb();
	await db.collection(key).deleteOne({ _id: new ObjectId(id) });
}

type GalleryInput = { id?: string; image: string; title?: string; type?: string };

export async function saveGallery(items: GalleryInput[]): Promise<void> {
	const db = await getDb();
	const gallery = db.collection('gallery');
	const keepIds = new Set<string>();
	for (let index = 0; index < items.length; index++) {
		const item = items[index];
		const data = { image: item.image, title: item.title ?? '', type: item.type ?? '', order: index };
		if (item.id) {
			await gallery.updateOne({ _id: new ObjectId(item.id) }, { $set: data });
			keepIds.add(item.id);
		} else {
			const result = await gallery.insertOne(data);
			keepIds.add(result.insertedId.toString());
		}
	}
	const existing = await gallery.find({}, { projection: { _id: 1 } }).toArray();
	for (const doc of existing) {
		if (!keepIds.has(doc._id.toString())) {
			await gallery.deleteOne({ _id: doc._id });
		}
	}
}

export async function reorderDocuments(key: string, ids: string[]): Promise<void> {
	const db = await getDb();
	const collection = db.collection(key);
	await Promise.all(
		ids.map((id, index) =>
			collection.updateOne({ _id: new ObjectId(id) }, { $set: { order: index } })
		)
	);
}
