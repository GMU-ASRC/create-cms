export const collectionIcons: Record<string, string> = {
	siteInfo: 'mdi:home-city-outline',
	news: 'mdi:newspaper-variant-outline',
	projects: 'mdi:rocket-launch-outline',
	researchArticles: 'mdi:file-document-outline',
	publications: 'mdi:book-open-variant',
	team: 'mdi:account-group-outline',
	sponsors: 'mdi:handshake-outline',
	media: 'mdi:image-multiple-outline',
	users: 'mdi:account-key-outline'
};

export const collectionTints: Record<string, string> = {
	siteInfo: 'bg-emerald-100 text-emerald-700',
	news: 'bg-sky-100 text-sky-700',
	projects: 'bg-violet-100 text-violet-700',
	researchArticles: 'bg-amber-100 text-amber-700',
	publications: 'bg-rose-100 text-rose-700',
	team: 'bg-teal-100 text-teal-700',
	sponsors: 'bg-indigo-100 text-indigo-700',
	media: 'bg-cyan-100 text-cyan-700',
	users: 'bg-slate-200 text-slate-700'
};

export function iconFor(key: string): string {
	return collectionIcons[key] ?? 'mdi:circle-outline';
}

export function tintFor(key: string): string {
	return collectionTints[key] ?? 'bg-slate-100 text-slate-600';
}
