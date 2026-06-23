import { GridFSBucket, ObjectId } from 'mongodb';
import { env } from '$env/dynamic/private';
import { getDb } from './db';

export type SnapshotMeta = {
	id: string;
	url: string;
	title: string;
	size: number;
	capturedAt: Date;
};

const userAgent =
	'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36';

async function snapshotBucket() {
	const db = await getDb();
	return new GridFSBucket(db, { bucketName: 'snapshots' });
}

function toAbsolute(ref: string, base: string): string | null {
	const value = ref.trim();
	if (!value || value.startsWith('data:') || value.startsWith('#') || /^(javascript|mailto|tel):/i.test(value)) {
		return null;
	}
	try {
		return new URL(value, base).toString();
	} catch {
		return null;
	}
}

async function fetchText(url: string): Promise<string | null> {
	try {
		const response = await fetch(url, { headers: { 'user-agent': userAgent } });
		if (!response.ok) return null;
		return await response.text();
	} catch {
		return null;
	}
}

async function fetchDataUri(url: string, maxBytes = 3_000_000): Promise<string | null> {
	try {
		const response = await fetch(url, { headers: { 'user-agent': userAgent } });
		if (!response.ok) return null;
		const buffer = Buffer.from(await response.arrayBuffer());
		if (buffer.length === 0 || buffer.length > maxBytes) return null;
		const type = (response.headers.get('content-type') ?? 'application/octet-stream').split(';')[0];
		return `data:${type};base64,${buffer.toString('base64')}`;
	} catch {
		return null;
	}
}

function inlineCssUrls(css: string, cssBase: string): string {
	return css.replace(/url\(\s*(['"]?)([^'")]+)\1\s*\)/gi, (match, quote, ref) => {
		const abs = toAbsolute(ref, cssBase);
		return abs ? `url(${quote}${abs}${quote})` : match;
	});
}

async function inlineStylesheets(html: string, pageUrl: string): Promise<string> {
	const tags = html.match(/<link\b[^>]*>/gi) ?? [];
	for (const tag of tags) {
		if (!/rel\s*=\s*['"]?stylesheet/i.test(tag)) continue;
		const hrefMatch = /href\s*=\s*['"]([^'"]+)['"]/i.exec(tag);
		if (!hrefMatch) continue;
		const cssUrl = toAbsolute(hrefMatch[1], pageUrl);
		if (!cssUrl) continue;
		const css = await fetchText(cssUrl);
		if (css === null) continue;
		const inlined = `<style>${inlineCssUrls(css, cssUrl)}</style>`;
		html = html.replace(tag, () => inlined);
	}
	return html;
}

async function inlineImages(html: string, pageUrl: string, limit = 60): Promise<string> {
	const tags = (html.match(/<img\b[^>]*>/gi) ?? []).slice(0, limit);
	const jobs: Array<{ tag: string; srcFull: string; url: string }> = [];
	for (const tag of tags) {
		const srcMatch = /\ssrc\s*=\s*['"]([^'"]+)['"]/i.exec(tag);
		if (!srcMatch || srcMatch[1].startsWith('data:')) continue;
		const imgUrl = toAbsolute(srcMatch[1], pageUrl);
		if (!imgUrl) continue;
		jobs.push({ tag, srcFull: srcMatch[0], url: imgUrl });
	}
	const dataUris = await Promise.all(jobs.map((job) => fetchDataUri(job.url)));
	jobs.forEach((job, index) => {
		const dataUri = dataUris[index];
		if (!dataUri) return;
		const newTag = job.tag
			.replace(job.srcFull, ` src="${dataUri}"`)
			.replace(/\ssrcset\s*=\s*['"][^'"]*['"]/i, '');
		html = html.replace(job.tag, () => newTag);
	});
	return html;
}

function stripScripts(html: string): string {
	return html
		.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '')
		.replace(/<script\b[^>]*\/>/gi, '')
		.replace(/\son\w+\s*=\s*"[^"]*"/gi, '')
		.replace(/\son\w+\s*=\s*'[^']*'/gi, '');
}

async function fetchRenderedHtml(targetUrl: string): Promise<string | null> {
	const base = env.BROWSER_RENDER_URL;
	if (!base) return null;
	const token = env.BROWSERLESS_TOKEN ?? '';
	// `timeout` bounds the whole Browserless session so the tab is always
	// closed and reclaimed, even if the render hangs. The /content endpoint
	// also closes the page once it returns the rendered HTML.
	const params = new URLSearchParams({ timeout: '30000' });
	if (token) params.set('token', token);
	const endpoint = `${base.replace(/\/$/, '')}/content?${params.toString()}`;
	try {
		const response = await fetch(endpoint, {
			method: 'POST',
			headers: { 'content-type': 'application/json' },
			body: JSON.stringify({
				url: targetUrl,
				gotoOptions: { waitUntil: 'networkidle0', timeout: 30000 }
			})
		});
		if (!response.ok) return null;
		const html = await response.text();
		return html && /<\w/.test(html) ? html : null;
	} catch {
		return null;
	}
}

function injectBase(html: string, pageUrl: string): string {
	const baseTag = `<base href="${pageUrl}">`;
	if (/<head[^>]*>/i.test(html)) {
		return html.replace(/<head[^>]*>/i, (match) => `${match}${baseTag}`);
	}
	return baseTag + html;
}

export async function captureSnapshot(targetUrl: string): Promise<SnapshotMeta> {
	let pageUrl: string;
	try {
		const parsed = new URL(targetUrl);
		if (!/^https?:$/.test(parsed.protocol)) throw new Error('bad protocol');
		pageUrl = parsed.toString();
	} catch {
		throw new Error('Enter a valid URL including http:// or https://');
	}

	let finalUrl = pageUrl;
	let html = await fetchRenderedHtml(pageUrl);
	if (html === null) {
		const response = await fetch(pageUrl, { headers: { 'user-agent': userAgent } });
		if (!response.ok) {
			throw new Error(`Could not fetch the page (HTTP ${response.status})`);
		}
		finalUrl = response.url || pageUrl;
		html = await response.text();
	}

	const title =
		(/<title[^>]*>([\s\S]*?)<\/title>/i.exec(html)?.[1] ?? '').replace(/\s+/g, ' ').trim() || finalUrl;

	html = stripScripts(html);
	html = await inlineStylesheets(html, finalUrl);
	html = await inlineImages(html, finalUrl);
	html = injectBase(html, finalUrl);

	const buffer = Buffer.from(html, 'utf-8');
	const bucket = await snapshotBucket();
	const fileId = await new Promise<string>((resolve, reject) => {
		const stream = bucket.openUploadStream('snapshot.html', {
			contentType: 'text/html; charset=utf-8'
		});
		stream.on('error', reject);
		stream.on('finish', () => resolve(stream.id.toString()));
		stream.end(buffer);
	});

	const capturedAt = new Date();
	const db = await getDb();
	const result = await db
		.collection('snapshots')
		.insertOne({ url: finalUrl, title, fileId, size: buffer.length, capturedAt });
	return { id: result.insertedId.toString(), url: finalUrl, title, size: buffer.length, capturedAt };
}

export async function listSnapshots(): Promise<SnapshotMeta[]> {
	const db = await getDb();
	const rows = await db.collection('snapshots').find({}).sort({ capturedAt: -1 }).toArray();
	return rows.map((row) => ({
		id: row._id.toString(),
		url: String(row.url ?? ''),
		title: String(row.title ?? ''),
		size: Number(row.size ?? 0),
		capturedAt: row.capturedAt instanceof Date ? row.capturedAt : new Date(row.capturedAt)
	}));
}

export async function getSnapshot(id: string): Promise<SnapshotMeta | null> {
	let objectId: ObjectId;
	try {
		objectId = new ObjectId(id);
	} catch {
		return null;
	}
	const db = await getDb();
	const row = await db.collection('snapshots').findOne({ _id: objectId });
	if (!row) return null;
	return {
		id: row._id.toString(),
		url: String(row.url ?? ''),
		title: String(row.title ?? ''),
		size: Number(row.size ?? 0),
		capturedAt: row.capturedAt instanceof Date ? row.capturedAt : new Date(row.capturedAt)
	};
}

export async function getSnapshotHtml(id: string): Promise<Buffer | null> {
	let objectId: ObjectId;
	try {
		objectId = new ObjectId(id);
	} catch {
		return null;
	}
	const db = await getDb();
	const meta = await db.collection('snapshots').findOne({ _id: objectId });
	if (!meta?.fileId) return null;
	let fileObjectId: ObjectId;
	try {
		fileObjectId = new ObjectId(String(meta.fileId));
	} catch {
		return null;
	}
	const bucket = await snapshotBucket();
	const files = await bucket.find({ _id: fileObjectId }).toArray();
	if (files.length === 0) return null;
	return new Promise((resolve, reject) => {
		const chunks: Buffer[] = [];
		const stream = bucket.openDownloadStream(fileObjectId);
		stream.on('data', (chunk) => chunks.push(chunk as Buffer));
		stream.on('error', reject);
		stream.on('end', () => resolve(Buffer.concat(chunks)));
	});
}

export async function deleteSnapshot(id: string): Promise<void> {
	let objectId: ObjectId;
	try {
		objectId = new ObjectId(id);
	} catch {
		return;
	}
	const db = await getDb();
	const meta = await db.collection('snapshots').findOne({ _id: objectId });
	if (meta?.fileId) {
		const bucket = await snapshotBucket();
		try {
			await bucket.delete(new ObjectId(String(meta.fileId)));
		} catch {
			// file may already be gone
		}
	}
	await db.collection('snapshots').deleteOne({ _id: objectId });
}
