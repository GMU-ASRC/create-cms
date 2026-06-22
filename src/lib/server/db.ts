import { MongoClient } from 'mongodb';
import { env } from '$env/dynamic/private';

let clientPromise: Promise<MongoClient> | undefined;

function connect(): Promise<MongoClient> {
	if (!clientPromise) {
		const uri = env.MONGODB_URI;
		if (!uri) {
			throw new Error('MONGODB_URI is not set');
		}
		clientPromise = new MongoClient(uri).connect();
	}
	return clientPromise;
}

export async function getDb() {
	const client = await connect();
	return client.db(env.MONGODB_DB || 'cms');
}
