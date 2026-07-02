import { MongoClient, GridFSBucket, ObjectId } from 'mongodb';
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
		const bucket = new GridFSBucket(db, { bucketName: 'snapshots' });
		const snapshots = db.collection('snapshots');
		const rows = await snapshots.find({ fileId: { $exists: true } }).toArray();

		console.log(`Found ${rows.length} snapshots with a GridFS file`);
		if (dryRun) {
			console.log('Dry run: no files will be deleted');
		}
		let deleted = 0;
		let kept = 0;

		for (const row of rows) {
			const id = row._id.toString();
			if (!row.s3Key || !(await objectExists(String(row.s3Key)))) {
				console.warn(`Keeping ${id} (${row.title}) not found on S3, migrate it first`);
				kept += 1;
				continue;
			}

			let fileObjectId: ObjectId;
			try {
				fileObjectId = new ObjectId(String(row.fileId));
			} catch {
				await snapshots.updateOne({ _id: row._id }, { $unset: { fileId: '' } });
				continue;
			}

			if (dryRun) {
				console.log(`Would delete GridFS file for ${id} (${row.title})`);
			} else {
				try {
					await bucket.delete(fileObjectId);
				} catch {
					void 0;
				}
				await snapshots.updateOne({ _id: row._id }, { $unset: { fileId: '' } });
				console.log(`Deleted GridFS file for ${id} (${row.title})`);
			}
			deleted += 1;
		}

		console.log(
			`Done. ${dryRun ? 'Would delete' : 'Deleted'} ${deleted}, kept ${kept}, total ${rows.length}`
		);
	} finally {
		await client.close();
	}
}

main().catch((error) => {
	console.error(error);
	process.exit(1);
});
