import { MongoClient, GridFSBucket } from 'mongodb';
import {
	S3Client,
	CreateBucketCommand,
	HeadBucketCommand,
	HeadObjectCommand,
	PutObjectCommand
} from '@aws-sdk/client-s3';

const mongoUri = process.env.MONGODB_URI;
if (!mongoUri) {
	throw new Error('MONGODB_URI is not set');
}
const mongoDb = process.env.MONGODB_DB || 'cms';
const bucketName = process.env.RUSTFS_BUCKET || 'create-web';

const s3Client = new S3Client({
	region: process.env.RUSTFS_REGION || 'us-east-1',
	endpoint: process.env.RUSTFS_ENDPOINT || 'http://localhost:9000',
	credentials: {
		accessKeyId: process.env.RUSTFS_AK || '',
		secretAccessKey: process.env.RUSTFS_SK || ''
	},
	forcePathStyle: true,
	requestChecksumCalculation: 'WHEN_REQUIRED',
	responseChecksumValidation: 'WHEN_REQUIRED'
});

async function ensureBucket() {
	try {
		await s3Client.send(new HeadBucketCommand({ Bucket: bucketName }));
	} catch {
		console.log(`Creating bucket ${bucketName}`);
		await s3Client.send(new CreateBucketCommand({ Bucket: bucketName }));
	}
}

async function objectExists(key: string): Promise<boolean> {
	try {
		await s3Client.send(new HeadObjectCommand({ Bucket: bucketName, Key: key }));
		return true;
	} catch {
		return false;
	}
}

async function readStream(stream: NodeJS.ReadableStream): Promise<Buffer> {
	const chunks: Buffer[] = [];
	for await (const chunk of stream) {
		chunks.push(chunk as Buffer);
	}
	return Buffer.concat(chunks);
}

async function main() {
	await ensureBucket();

	const client = await new MongoClient(mongoUri).connect();
	try {
		const db = client.db(mongoDb);
		const bucket = new GridFSBucket(db, { bucketName: 'files' });
		const meta = db.collection('file_meta');
		const files = await bucket.find({}).sort({ uploadDate: 1 }).toArray();

		console.log(`Found ${files.length} files in GridFS`);
		let migrated = 0;
		let skipped = 0;

		for (const file of files) {
			const key = file._id.toString();
			const contentType = file.contentType || 'application/octet-stream';

			if (await objectExists(key)) {
				console.log(`Skipping ${key} (${file.filename}) already in bucket`);
				skipped += 1;
			} else {
				const data = await readStream(bucket.openDownloadStream(file._id));
				await s3Client.send(
					new PutObjectCommand({
						Bucket: bucketName,
						Key: key,
						Body: data,
						ContentType: contentType
					})
				);
				console.log(`Migrated ${key} (${file.filename}, ${data.length} bytes)`);
				migrated += 1;
			}

			await meta.updateOne(
				{ _id: key },
				{
					$set: {
						filename: file.filename,
						contentType,
						length: file.length,
						uploadDate: file.uploadDate
					}
				},
				{ upsert: true }
			);
		}

		console.log(`Done. Migrated ${migrated}, skipped ${skipped}, total ${files.length}`);
	} finally {
		await client.close();
	}
}

main().catch((error) => {
	console.error(error);
	process.exit(1);
});
