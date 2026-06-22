import { GridFSBucket, ObjectId } from 'mongodb';
import http from 'node:http';
import https from 'node:https';
import { getDb } from './db';

export const allowedUploadHint = 'image/*,application/pdf';

export function isAllowedUpload(contentType: string): boolean {
	return contentType.startsWith('image/') || contentType === 'application/pdf';
}

async function getBucket() {
	const db = await getDb();
	return new GridFSBucket(db, { bucketName: 'files' });
}

export async function uploadFile(
	filename: string,
	contentType: string,
	data: Buffer
): Promise<string> {
	const bucket = await getBucket();
	return new Promise((resolve, reject) => {
		const stream = bucket.openUploadStream(filename, { contentType });
		stream.on('error', reject);
		stream.on('finish', () => resolve(stream.id.toString()));
		stream.end(data);
	});
}

function filenameFromUrl(url: string): string {
	try {
		const path = new URL(url).pathname;
		const base = decodeURIComponent(path.split('/').filter(Boolean).pop() ?? '');
		if (base.toLowerCase().endsWith('.pdf')) return base;
		return `${base || 'document'}.pdf`;
	} catch {
		return 'document.pdf';
	}
}

export type MirrorResult =
	| { ok: true; path: string }
	| { ok: false; reason: string };

type DownloadedFile = {
	status: number;
	statusText: string;
	contentType: string;
	buffer: Buffer;
};

const downloadUserAgent =
	'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36';

function downloadUrl(url: string, redirectsLeft = 5): Promise<DownloadedFile> {
	return new Promise((resolve, reject) => {
		let target: URL;
		try {
			target = new URL(url);
		} catch {
			reject(new Error('Invalid URL'));
			return;
		}
		const client = target.protocol === 'http:' ? http : https;
		const options: https.RequestOptions = {
			method: 'GET',
			rejectUnauthorized: false,
			headers: { 'user-agent': downloadUserAgent, accept: 'application/pdf,*/*' }
		};
		const request = client.request(
			target,
			options,
			(response) => {
				const status = response.statusCode ?? 0;
				const location = response.headers.location;
				if (status >= 300 && status < 400 && location && redirectsLeft > 0) {
					response.resume();
					const next = new URL(location, target).toString();
					downloadUrl(next, redirectsLeft - 1).then(resolve, reject);
					return;
				}
				const chunks: Buffer[] = [];
				response.on('data', (chunk) => chunks.push(chunk as Buffer));
				response.on('end', () =>
					resolve({
						status,
						statusText: response.statusMessage ?? '',
						contentType: String(response.headers['content-type'] ?? 'unknown'),
						buffer: Buffer.concat(chunks)
					})
				);
				response.on('error', reject);
			}
		);
		request.on('error', reject);
		request.end();
	});
}

export async function mirrorExternalFileResult(url: string): Promise<MirrorResult> {
	if (typeof url !== 'string' || !/^https?:\/\//i.test(url)) {
		return { ok: false, reason: 'Not an external http(s) link' };
	}
	if (url.includes('/api/files/')) {
		return { ok: false, reason: 'Already stored in the database' };
	}
	console.log(`[mirror] fetching ${url}`);
	try {
		const { status, statusText, contentType, buffer } = await downloadUrl(url);
		if (status < 200 || status >= 300) {
			console.warn(`[mirror] ${url} -> HTTP ${status} ${statusText}`);
			return { ok: false, reason: `HTTP ${status} ${statusText}` };
		}
		if (buffer.length < 5 || buffer.subarray(0, 5).toString('latin1') !== '%PDF-') {
			console.warn(
				`[mirror] ${url} -> not a PDF (content-type: ${contentType}, ${buffer.length} bytes)`
			);
			return { ok: false, reason: `Response was not a PDF (${contentType})` };
		}
		const id = await uploadFile(filenameFromUrl(url), 'application/pdf', buffer);
		console.log(`[mirror] ${url} -> stored ${buffer.length} bytes as /api/files/${id}`);
		return { ok: true, path: `/api/files/${id}` };
	} catch (mirrorError) {
		const message = mirrorError instanceof Error ? mirrorError.message : String(mirrorError);
		const cause =
			mirrorError instanceof Error && mirrorError.cause ? ` (cause: ${String(mirrorError.cause)})` : '';
		console.error(`[mirror] ${url} -> download failed: ${message}${cause}`);
		return { ok: false, reason: `Download failed: ${message}` };
	}
}

export async function mirrorExternalFile(url: string): Promise<string | null> {
	const result = await mirrorExternalFileResult(url);
	return result.ok ? result.path : null;
}

export async function getFile(id: string) {
	let objectId: ObjectId;
	try {
		objectId = new ObjectId(id);
	} catch {
		return null;
	}
	const bucket = await getBucket();
	const files = await bucket.find({ _id: objectId }).toArray();
	if (files.length === 0) return null;
	const data: Buffer = await new Promise((resolve, reject) => {
		const chunks: Buffer[] = [];
		const stream = bucket.openDownloadStream(objectId);
		stream.on('data', (chunk) => chunks.push(chunk as Buffer));
		stream.on('error', reject);
		stream.on('end', () => resolve(Buffer.concat(chunks)));
	});
	return {
		data,
		contentType: files[0].contentType || 'application/octet-stream'
	};
}


export async function listFiles() {
	const bucket = await getBucket();
	const files = await bucket.find({}).sort({ uploadDate: -1 }).toArray();
	return files.map((file) => ({
		id: file._id.toString(),
		filename: file.filename,
		contentType: file.contentType,
		length: file.length,
		uploadDate: file.uploadDate
	}));
}

export async function deleteFile(id: string): Promise<void> {
	const bucket = await getBucket();
	await bucket.delete(new ObjectId(id));
}
