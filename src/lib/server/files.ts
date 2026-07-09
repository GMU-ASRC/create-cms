import { randomUUID } from 'node:crypto';
import http from 'node:http';
import https from 'node:https';
import {
	DeleteObjectCommand,
	GetObjectCommand,
	PutObjectCommand
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { getDb } from './db';
import { s3Client, bucketName } from './storage';

export const allowedUploadHint = 'Images, video, audio, PDFs, documents, and archives';

const dangerousExtensions = new Set([
	'exe', 'msi', 'bat', 'cmd', 'com', 'scr', 'pif', 'cpl', 'jar', 'js', 'mjs',
	'cjs', 'jse', 'vbs', 'vbe', 'ws', 'wsf', 'wsh', 'ps1', 'psm1', 'sh', 'bash',
	'zsh', 'apk', 'app', 'dmg', 'pkg', 'deb', 'rpm', 'run', 'bin', 'dll', 'sys',
	'drv', 'so', 'msc', 'gadget', 'reg', 'lnk', 'hta', 'inf', 'ins', 'isp', 'job',
	'vb', 'ade', 'adp', 'chm', 'crt', 'der', 'hlp', 'msh', 'scf'
]);

export function fileExtension(filename: string): string {
	const dot = filename.lastIndexOf('.');
	return dot === -1 ? '' : filename.slice(dot + 1).toLowerCase();
}

export function isAllowedUpload(contentType: string, filename: string): boolean {
	return !dangerousExtensions.has(fileExtension(filename));
}

type FileMeta = {
	_id: string;
	filename: string;
	contentType: string;
	length: number;
	uploadDate: Date;
};

async function getMetaCollection() {
	const db = await getDb();
	return db.collection<FileMeta>('file_meta');
}

function extensionFor(filename: string): string {
	const dot = filename.lastIndexOf('.');
	if (dot === -1) return '';
	const ext = filename.slice(dot + 1).toLowerCase();
	return /^[a-z0-9]{1,8}$/.test(ext) ? `.${ext}` : '';
}

export function newUploadKey(filename: string): string {
	return `${randomUUID()}${extensionFor(filename)}`;
}

export async function registerUploadedFile(
	key: string,
	filename: string,
	contentType: string,
	length: number
): Promise<void> {
	const meta = await getMetaCollection();
	await meta.insertOne({
		_id: key,
		filename,
		contentType,
		length,
		uploadDate: new Date()
	});
}

export async function uploadFile(
	filename: string,
	contentType: string,
	data: Buffer
): Promise<string> {
	const key = newUploadKey(filename);
	await s3Client.send(
		new PutObjectCommand({
			Bucket: bucketName,
			Key: key,
			Body: data,
			ContentType: contentType
		})
	);
	await registerUploadedFile(key, filename, contentType, data.length);
	return key;
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

export async function getFileUrl(id: string): Promise<string | null> {
	const meta = await getMetaCollection();
	const stored = await meta.findOne({ _id: id });
	if (!stored) return null;
	const command = new GetObjectCommand({
		Bucket: bucketName,
		Key: id,
		ResponseContentType: stored.contentType || 'application/octet-stream',
		ResponseCacheControl: 'public, max-age=31536000, immutable'
	});
	return getSignedUrl(s3Client, command, { expiresIn: 3600 });
}

export async function listFiles() {
	const meta = await getMetaCollection();
	const files = await meta.find({}).sort({ uploadDate: -1 }).toArray();
	return files.map((file) => ({
		id: file._id,
		filename: file.filename,
		contentType: file.contentType,
		length: file.length,
		uploadDate: file.uploadDate
	}));
}

export async function deleteFile(id: string): Promise<void> {
	await s3Client.send(new DeleteObjectCommand({ Bucket: bucketName, Key: id }));
	const meta = await getMetaCollection();
	await meta.deleteOne({ _id: id });
}
