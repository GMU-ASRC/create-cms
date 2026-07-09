export type UploadResult = { id: string; path: string };

async function readErrorMessage(response: Response): Promise<string> {
	try {
		const data = await response.json();
		if (data && typeof data.message === 'string') return data.message;
	} catch {
		// response had no JSON body
	}
	return 'Upload failed';
}

function putToStorage(
	uploadUrl: string,
	contentType: string,
	file: File | Blob,
	onProgress?: (percent: number) => void
): Promise<void> {
	return new Promise((resolve, reject) => {
		const request = new XMLHttpRequest();
		request.open('PUT', uploadUrl);
		request.setRequestHeader('Content-Type', contentType);
		request.upload.onprogress = (event) => {
			if (onProgress && event.lengthComputable) {
				onProgress(Math.round((event.loaded / event.total) * 100));
			}
		};
		request.onload = () => {
			if (request.status >= 200 && request.status < 300) resolve();
			else reject(new Error('Upload to storage failed'));
		};
		request.onerror = () => reject(new Error('Upload to storage failed'));
		request.send(file);
	});
}

export async function uploadToStorage(
	file: File,
	onProgress?: (percent: number) => void
): Promise<UploadResult> {
	const contentType = file.type || 'application/octet-stream';

	const presignResponse = await fetch('/admin/upload/presign', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ filename: file.name, contentType, size: file.size })
	});
	if (!presignResponse.ok) throw new Error(await readErrorMessage(presignResponse));
	const { key, uploadUrl, contentType: signedType } = await presignResponse.json();

	await putToStorage(uploadUrl, signedType, file, onProgress);

	const completeResponse = await fetch('/admin/upload/complete', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ key, filename: file.name, contentType: signedType, size: file.size })
	});
	if (!completeResponse.ok) throw new Error(await readErrorMessage(completeResponse));
	return (await completeResponse.json()) as UploadResult;
}
