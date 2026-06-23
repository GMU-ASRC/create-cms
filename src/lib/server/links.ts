import { ObjectId } from 'mongodb';
import { randomBytes } from 'node:crypto';
import { getDb } from './db';

export type LinkEntry = {
	id: string;
	slug: string;
	url: string;
	createdAt: Date;
};

export function generateSlug(length = 6): string {
	return randomBytes(16)
		.toString('base64')
		.replace(/[^a-zA-Z0-9]/g, '')
		.slice(0, length);
}

export async function listLinks(): Promise<LinkEntry[]> {
	const db = await getDb();
	const links = await db.collection('links').find({}).sort({ createdAt: -1 }).toArray();
	return links.map((link) => ({
		id: link._id.toString(),
		slug: String(link.slug ?? ''),
		url: String(link.url ?? ''),
		createdAt: link.createdAt instanceof Date ? link.createdAt : new Date(link.createdAt)
	}));
}

export async function createLink(slug: string, url: string): Promise<string> {
	const db = await getDb();
	const links = db.collection('links');
	const finalSlug = slug || generateSlug();
	const existing = await links.findOne({ slug: finalSlug });
	if (existing) {
		throw new Error('That short code is already in use');
	}
	await links.insertOne({ slug: finalSlug, url, createdAt: new Date() });
	return finalSlug;
}

export async function deleteLink(id: string): Promise<void> {
	const db = await getDb();
	await db.collection('links').deleteOne({ _id: new ObjectId(id) });
}

export async function getLinkUrl(slug: string): Promise<string | null> {
	const db = await getDb();
	const link = await db.collection('links').findOne({ slug });
	return link ? String(link.url) : null;
}
