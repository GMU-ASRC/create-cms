import { GridFSBucket, ObjectId } from 'mongodb';
import { randomUUID } from 'node:crypto';
import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { env } from '$env/dynamic/private';
import { getDb } from './db';
import { s3Client, bucketName, assertStorageLimit } from './storage';

export type SnapshotMeta = {
	id: string;
	url: string;
	title: string;
	size: number;
	contentType: string;
	capturedAt: Date;
};

const htmlContentType = 'text/html; charset=utf-8';

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

function looksLikeBotChallenge(html: string): boolean {
	return /Protected by Anubis|making sure you're not a bot|unusual traffic from your computer network|please enable javascript on your web browser/i.test(
		html
	);
}

function stripScripts(html: string): string {
	return html
		.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '')
		.replace(/<script\b[^>]*\/>/gi, '')
		.replace(/\son\w+\s*=\s*"[^"]*"/gi, '')
		.replace(/\son\w+\s*=\s*'[^']*'/gi, '');
}

function sanitizeHtml(html: string): string {
	return stripScripts(html)
		.replace(/<iframe\b[^>]*>[\s\S]*?<\/iframe>/gi, '')
		.replace(/<(object|embed|applet)\b[^>]*>[\s\S]*?<\/\1>/gi, '')
		.replace(/<(object|embed|applet)\b[^>]*\/?>/gi, '')
		.replace(/<meta\b[^>]*http-equiv\s*=\s*['"]?\s*refresh[^>]*>/gi, '')
		.replace(/<link\b[^>]*rel\s*=\s*['"]?\s*import[^>]*>/gi, '')
		.replace(/\s(href|src|action)\s*=\s*(['"])\s*javascript:[^'"]*\2/gi, ' $1="#"')
		.replace(/\s(href|src|action)\s*=\s*(['"])\s*data:text\/html[^'"]*\2/gi, ' $1="#"');
}

async function storeSnapshot(
	url: string,
	title: string,
	buffer: Buffer,
	contentType: string
): Promise<SnapshotMeta> {
	await assertStorageLimit(buffer.length);
	const s3Key = `snapshots/${randomUUID()}`;
	await s3Client.send(
		new PutObjectCommand({ Bucket: bucketName, Key: s3Key, Body: buffer, ContentType: contentType })
	);
	const capturedAt = new Date();
	const db = await getDb();
	const result = await db
		.collection('snapshots')
		.insertOne({ url, title, s3Key, size: buffer.length, contentType, capturedAt });
	return {
		id: result.insertedId.toString(),
		url,
		title,
		size: buffer.length,
		contentType,
		capturedAt
	};
}

async function fetchRenderedHtml(targetUrl: string): Promise<string | null> {
	const base = env.BROWSER_RENDER_URL;
	if (!base) return null;
	const token = env.BROWSERLESS_TOKEN ?? '';
	// `timeout` bounds the whole Browserless session so the tab is always
	// closed and reclaimed, even if the render hangs. The /content endpoint
	// also closes the page once it returns the rendered HTML.
	const params = new URLSearchParams({ timeout: '60000' });
	if (token) params.set('token', token);
	const endpoint = `${base.replace(/\/$/, '')}/content?${params.toString()}`;
	try {
		const response = await fetch(endpoint, {
			method: 'POST',
			headers: { 'content-type': 'application/json' },
			body: JSON.stringify({
				url: targetUrl,
				gotoOptions: { waitUntil: 'networkidle2', timeout: 60000 },
				waitForTimeout: 8000
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

	if (looksLikeBotChallenge(html)) {
		throw new Error('The page returned a bot-protection challenge instead of its content, so it was not archived.');
	}

	const title =
		(/<title[^>]*>([\s\S]*?)<\/title>/i.exec(html)?.[1] ?? '').replace(/\s+/g, ' ').trim() || finalUrl;

	html = stripScripts(html);
	html = await inlineStylesheets(html, finalUrl);
	html = await inlineImages(html, finalUrl);
	html = injectBase(html, finalUrl);

	return storeSnapshot(finalUrl, title, Buffer.from(html, 'utf-8'), htmlContentType);
}

function titleFromFileName(fileName: string): string {
	return fileName.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' ').trim();
}

export async function saveUploadedSnapshot(fileName: string, rawHtml: string): Promise<SnapshotMeta> {
	if (!rawHtml || !/<\w/.test(rawHtml)) {
		throw new Error('The uploaded file does not look like an HTML page.');
	}
	const html = sanitizeHtml(rawHtml);
	const title =
		(/<title[^>]*>([\s\S]*?)<\/title>/i.exec(html)?.[1] ?? '').replace(/\s+/g, ' ').trim() ||
		titleFromFileName(fileName) ||
		'Uploaded page';
	return storeSnapshot(fileName, title, Buffer.from(html, 'utf-8'), htmlContentType);
}

export async function saveUploadedFileSnapshot(
	fileName: string,
	buffer: Buffer,
	contentType: string
): Promise<SnapshotMeta> {
	if (buffer.length === 0) {
		throw new Error('The uploaded file is empty.');
	}
	const title = titleFromFileName(fileName) || 'Uploaded file';
	return storeSnapshot(fileName, title, buffer, contentType);
}

export async function listSnapshots(): Promise<SnapshotMeta[]> {
	const db = await getDb();
	const rows = await db.collection('snapshots').find({}).sort({ capturedAt: -1 }).toArray();
	return rows.map((row) => ({
		id: row._id.toString(),
		url: String(row.url ?? ''),
		title: String(row.title ?? ''),
		size: Number(row.size ?? 0),
		contentType: String(row.contentType ?? htmlContentType),
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
		contentType: String(row.contentType ?? htmlContentType),
		capturedAt: row.capturedAt instanceof Date ? row.capturedAt : new Date(row.capturedAt)
	};
}

export async function getSnapshotFile(
	id: string
): Promise<{ buffer: Buffer; contentType: string } | null> {
	let objectId: ObjectId;
	try {
		objectId = new ObjectId(id);
	} catch {
		return null;
	}
	const db = await getDb();
	const meta = await db.collection('snapshots').findOne({ _id: objectId });
	if (!meta) return null;
	const contentType = String(meta.contentType ?? htmlContentType);
	if (meta.s3Key) {
		try {
			const response = await s3Client.send(
				new GetObjectCommand({ Bucket: bucketName, Key: String(meta.s3Key) })
			);
			const bytes = await response.Body?.transformToByteArray();
			if (bytes) return { buffer: Buffer.from(bytes), contentType };
		} catch (s3Error) {
			console.error(`[snapshot] S3 read failed for ${id} (${String(meta.s3Key)}):`, s3Error);
		}
	}
	if (!meta.fileId) return null;
	let fileObjectId: ObjectId;
	try {
		fileObjectId = new ObjectId(String(meta.fileId));
	} catch {
		return null;
	}
	const bucket = await snapshotBucket();
	const files = await bucket.find({ _id: fileObjectId }).toArray();
	if (files.length === 0) return null;
	const buffer = await new Promise<Buffer>((resolve, reject) => {
		const chunks: Buffer[] = [];
		const stream = bucket.openDownloadStream(fileObjectId);
		stream.on('data', (chunk) => chunks.push(chunk as Buffer));
		stream.on('error', reject);
		stream.on('end', () => resolve(Buffer.concat(chunks)));
	});
	return { buffer, contentType };
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
	if (meta?.s3Key) {
		try {
			await s3Client.send(
				new DeleteObjectCommand({ Bucket: bucketName, Key: String(meta.s3Key) })
			);
		} catch {
			void 0;
		}
	}
	if (meta?.fileId) {
		const bucket = await snapshotBucket();
		try {
			await bucket.delete(new ObjectId(String(meta.fileId)));
		} catch {
			void 0;
		}
	}
	await db.collection('snapshots').deleteOne({ _id: objectId });
}
