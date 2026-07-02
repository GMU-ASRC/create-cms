import { MongoClient, GridFSBucket, ObjectId } from 'mongodb';
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
		const bucket = new GridFSBucket(db, { bucketName: 'snapshots' });
		const snapshots = db.collection('snapshots');
		const rows = await snapshots.find({}).sort({ capturedAt: 1 }).toArray();

		console.log(`Found ${rows.length} snapshots`);
		let migrated = 0;
		let skipped = 0;
		let missing = 0;

		for (const row of rows) {
			const id = row._id.toString();
			if (row.s3Key && (await objectExists(String(row.s3Key)))) {
				console.log(`Skipping ${id} (${row.title}) already on S3`);
				skipped += 1;
				continue;
			}
			if (!row.fileId) {
				console.warn(`Skipping ${id} (${row.title}) has no GridFS file`);
				missing += 1;
				continue;
			}

			let fileObjectId: ObjectId;
			try {
				fileObjectId = new ObjectId(String(row.fileId));
			} catch {
				console.warn(`Skipping ${id} (${row.title}) invalid fileId`);
				missing += 1;
				continue;
			}

			const files = await bucket.find({ _id: fileObjectId }).toArray();
			if (files.length === 0) {
				console.warn(`Skipping ${id} (${row.title}) GridFS file not found`);
				missing += 1;
				continue;
			}

			const key = `snapshots/${id}`;
			const data = await readStream(bucket.openDownloadStream(fileObjectId));
			await s3Client.send(
				new PutObjectCommand({
					Bucket: bucketName,
					Key: key,
					Body: data,
					ContentType: String(row.contentType ?? 'text/html; charset=utf-8')
				})
			);
			await snapshots.updateOne({ _id: row._id }, { $set: { s3Key: key } });
			console.log(`Migrated ${id} (${row.title}, ${data.length} bytes)`);
			migrated += 1;
		}

		console.log(
			`Done. Migrated ${migrated}, skipped ${skipped}, missing ${missing}, total ${rows.length}`
		);
	} finally {
		await client.close();
	}
}

main().catch((error) => {
	console.error(error);
	process.exit(1);
});
