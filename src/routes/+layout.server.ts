import type { LayoutServerLoad } from './$types';
import { getDb } from '$lib/server/db';

export const load: LayoutServerLoad = async ({ locals }) => {
	let logo: string | null = null;
	try {
		const db = await getDb();
		const info = await db.collection('siteInfo').findOne({});
		logo = (info?.logo as string) || null;
	} catch {
		logo = null;
	}
	return { user: locals.user, logo };
};
