import { S3Client, PutBucketCorsCommand, GetBucketCorsCommand } from '@aws-sdk/client-s3';

const bucketName = process.env.RUSTFS_BUCKET || 'create-web';

const defaultOrigins = 'http://localhost:5173,http://localhost:5174';

const allowedOrigins = (process.env.RUSTFS_CORS_ORIGINS || defaultOrigins)
	.split(',')
	.map((origin) => origin.trim())
	.filter(Boolean);

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

async function main() {
	await s3Client.send(
		new PutBucketCorsCommand({
			Bucket: bucketName,
			CORSConfiguration: {
				CORSRules: [
					{
						AllowedMethods: ['GET', 'PUT', 'HEAD'],
						AllowedOrigins: allowedOrigins,
						AllowedHeaders: ['*'],
						ExposeHeaders: ['ETag'],
						MaxAgeSeconds: 3600
					}
				]
			}
		})
	);
	console.log(`Applied CORS to ${bucketName} for origins: ${allowedOrigins.join(', ')}`);

	const current = await s3Client.send(new GetBucketCorsCommand({ Bucket: bucketName }));
	console.log(JSON.stringify(current.CORSRules, null, 2));
}

main().catch((error) => {
	console.error(error);
	process.exit(1);
});
