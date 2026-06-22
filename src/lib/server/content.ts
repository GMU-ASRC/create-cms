import { ObjectId } from 'mongodb';
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
			for (const match of json.matchAll(/\/api\/files\/([a-f0-9]{24})/gi)) {
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

export async function listDocuments(key: string): Promise<Document[]> {
	const db = await getDb();
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

export async function reorderDocuments(key: string, ids: string[]): Promise<void> {
	const db = await getDb();
	const collection = db.collection(key);
	await Promise.all(
		ids.map((id, index) =>
			collection.updateOne({ _id: new ObjectId(id) }, { $set: { order: index } })
		)
	);
}
