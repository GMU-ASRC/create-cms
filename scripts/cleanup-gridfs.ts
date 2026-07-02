import { MongoClient, GridFSBucket } from 'mongodb';
import { S3Client, HeadObjectCommand } from '@aws-sdk/client-s3';

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

async function objectExists(key: string): Promise<boolean> {
	try {
		await s3Client.send(new HeadObjectCommand({ Bucket: bucketName, Key: key }));
		return true;
	} catch {
		return false;
	}
}

async function main() {
	const dryRun = process.argv.includes('--dry-run');
	const client = await new MongoClient(mongoUri).connect();
	try {
		const db = client.db(mongoDb);
		const bucket = new GridFSBucket(db, { bucketName: 'files' });
		const files = await bucket.find({}).toArray();

		console.log(`Found ${files.length} files in GridFS`);
		if (dryRun) {
			console.log('Dry run: no files will be deleted');
		}
		let deleted = 0;
		let kept = 0;

		for (const file of files) {
			const key = file._id.toString();
			if (!(await objectExists(key))) {
				console.warn(`Keeping ${key} (${file.filename}) not found in bucket, migrate it first`);
				kept += 1;
				continue;
			}
			if (dryRun) {
				console.log(`Would delete ${key} (${file.filename})`);
			} else {
				await bucket.delete(file._id);
				console.log(`Deleted ${key} (${file.filename}) from GridFS`);
			}
			deleted += 1;
		}

		console.log(
			`Done. ${dryRun ? 'Would delete' : 'Deleted'} ${deleted}, kept ${kept}, total ${files.length}`
		);
	} finally {
		await client.close();
	}
}

main().catch((error) => {
	console.error(error);
	process.exit(1);
});
