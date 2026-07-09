import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { isAllowedUpload, newUploadKey } from '$lib/server/files';
import { s3Client, bucketName, assertStorageLimit } from '$lib/server/storage';

export const POST: RequestHandler = async ({ request, locals }) => {
	if (!locals.user) {
		error(401, 'Unauthorized');
	}
	const { filename, contentType, size } = await request.json();
	if (typeof filename !== 'string' || filename.length === 0) {
		error(400, 'No filename provided');
	}
	if (typeof size !== 'number' || size <= 0) {
		error(400, 'Invalid file size');
	}
	const type = typeof contentType === 'string' && contentType ? contentType : 'application/octet-stream';
	if (!isAllowedUpload(type, filename)) {
		error(400, 'This file type is not allowed');
	}
	try {
		await assertStorageLimit(size);
	} catch (limitError) {
		error(413, (limitError as Error).message);
	}
	const key = newUploadKey(filename);
	const command = new PutObjectCommand({ Bucket: bucketName, Key: key, ContentType: type });
	const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
	return json({ key, uploadUrl, contentType: type });
};
