import { S3Client, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { env } from '$env/dynamic/private';

export const bucketName = env.RUSTFS_BUCKET || 'create-web';

export const storageLimitBytes = (Number(env.RUSTFS_STORAGE_LIMIT_GB) || 50) * 1_000_000_000;

export const s3Client = new S3Client({
	region: env.RUSTFS_REGION || 'us-east-1',
	endpoint: env.RUSTFS_ENDPOINT || 'http://localhost:9000',
	credentials: {
		accessKeyId: env.RUSTFS_AK || '',
		secretAccessKey: env.RUSTFS_SK || ''
	},
	forcePathStyle: true,
	requestChecksumCalculation: 'WHEN_REQUIRED',
	responseChecksumValidation: 'WHEN_REQUIRED'
});

export type StorageGroup = { objects: number; bytes: number };

export type StorageStats = {
	bucket: string;
	endpoint: string;
	totalObjects: number;
	totalBytes: number;
	limitBytes: number;
	largestBytes: number;
	media: StorageGroup;
	snapshots: StorageGroup;
};

export async function getStorageStats(): Promise<StorageStats> {
	let continuationToken: string | undefined;
	let totalObjects = 0;
	let totalBytes = 0;
	let largestBytes = 0;
	const media: StorageGroup = { objects: 0, bytes: 0 };
	const snapshots: StorageGroup = { objects: 0, bytes: 0 };

	do {
		const response = await s3Client.send(
			new ListObjectsV2Command({ Bucket: bucketName, ContinuationToken: continuationToken })
		);
		for (const object of response.Contents ?? []) {
			const size = object.Size ?? 0;
			totalObjects += 1;
			totalBytes += size;
			if (size > largestBytes) largestBytes = size;
			if ((object.Key ?? '').startsWith('snapshots/')) {
				snapshots.objects += 1;
				snapshots.bytes += size;
			} else {
				media.objects += 1;
				media.bytes += size;
			}
		}
		continuationToken = response.IsTruncated ? response.NextContinuationToken : undefined;
	} while (continuationToken);

	return {
		bucket: bucketName,
		endpoint: env.RUSTFS_ENDPOINT || 'http://localhost:9000',
		totalObjects,
		totalBytes,
		limitBytes: storageLimitBytes,
		largestBytes,
		media,
		snapshots
	};
}

export async function usedBytes(): Promise<number> {
	let continuationToken: string | undefined;
	let total = 0;
	do {
		const response = await s3Client.send(
			new ListObjectsV2Command({ Bucket: bucketName, ContinuationToken: continuationToken })
		);
		for (const object of response.Contents ?? []) {
			total += object.Size ?? 0;
		}
		continuationToken = response.IsTruncated ? response.NextContinuationToken : undefined;
	} while (continuationToken);
	return total;
}

export async function assertStorageLimit(incomingBytes: number): Promise<void> {
	const used = await usedBytes();
	if (used + incomingBytes > storageLimitBytes) {
		const limitGb = (storageLimitBytes / 1_000_000_000).toFixed(0);
		throw new Error(`Storage limit of ${limitGb} GB reached. Free up space to upload more.`);
	}
}
