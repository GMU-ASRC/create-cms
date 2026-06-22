export type CollectionMeta = {
	key: string;
	label: string;
	titleField: string;
	singleton?: boolean;
};

export const collections: CollectionMeta[] = [
	{ key: 'siteInfo', label: 'Site Info', titleField: 'labName', singleton: true },
	{ key: 'news', label: 'News', titleField: 'title' },
	{ key: 'projects', label: 'Projects', titleField: 'title' },
	{ key: 'researchArticles', label: 'Research Articles', titleField: 'title' },
	{ key: 'publications', label: 'Publications', titleField: 'title' },
	{ key: 'team', label: 'Team', titleField: 'name' },
	{ key: 'sponsors', label: 'Sponsors', titleField: 'name' }
];

export function getCollectionMeta(key: string): CollectionMeta | undefined {
	return collections.find((collection) => collection.key === key);
}
