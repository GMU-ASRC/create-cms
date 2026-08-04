import { env } from '$env/dynamic/private';
import { getClient } from '@umami/api-client';

export type TimeSeriesPoint = { x: string; y: number };
export type NamedCount = { name: string; count: number };

export type AnalyticsData = {
	stats: {
		pageviews: number;
		visitors: number;
		visits: number;
		bounces: number;
		totaltime: number;
	};
	pageviews: TimeSeriesPoint[];
	visitors: TimeSeriesPoint[];
	topPages: NamedCount[];
	referrers: NamedCount[];
	browsers: NamedCount[];
	devices: NamedCount[];
	countries: NamedCount[];
};

type WebsiteStatsResponse = {
	pageviews: number;
	visitors: number;
	visits: number;
	bounces: number;
	totaltime: number;
};

type WebsitePageviewsResponse = {
	pageviews: TimeSeriesPoint[];
	sessions: TimeSeriesPoint[];
};

function toNamedCounts(metrics?: { x: string; y: number }[]): NamedCount[] {
	return (metrics ?? []).map((metric) => ({ name: metric.x || '(none)', count: metric.y }));
}

const hourMs = 60 * 60 * 1000;
const dayMs = 24 * hourMs;

function fillTimeSeries(
	startAt: number,
	endAt: number,
	unit: 'hour' | 'day',
	points: TimeSeriesPoint[]
): TimeSeriesPoint[] {
	const stepMs = unit === 'hour' ? hourMs : dayMs;
	const countByTime = new Map(points.map((point) => [new Date(point.x).getTime(), point.y]));

	const buckets: TimeSeriesPoint[] = [];
	const firstBucket = Math.floor(startAt / stepMs) * stepMs;
	for (let time = firstBucket; time <= endAt; time += stepMs) {
		buckets.push({ x: new Date(time).toISOString(), y: countByTime.get(time) ?? 0 });
	}
	return buckets;
}

export async function getAnalytics(
	startAt: number,
	endAt: number,
	unit: 'hour' | 'day' = 'day'
): Promise<AnalyticsData> {
	const websiteId = env.UMAMI_WEBSITE_ID;
	if (!websiteId) {
		throw new Error('UMAMI_WEBSITE_ID is not configured');
	}

	const client = getClient({
		userId: env.UMAMI_API_CLIENT_USER_ID,
		secret: env.UMAMI_API_CLIENT_SECRET,
		apiEndpoint: env.UMAMI_API_CLIENT_ENDPOINT
	});

	const [stats, pageviews, pages, referrers, browsers, devices, countries] = await Promise.all([
		client.getWebsiteStats(websiteId, { startAt, endAt }),
		client.getWebsitePageviews(websiteId, { startAt, endAt, unit, timezone: 'UTC' }),
		client.getWebsiteMetrics(websiteId, { type: 'path', startAt, endAt, limit: 10 }),
		client.getWebsiteMetrics(websiteId, { type: 'referrer', startAt, endAt, limit: 10 }),
		client.getWebsiteMetrics(websiteId, { type: 'browser', startAt, endAt, limit: 8 }),
		client.getWebsiteMetrics(websiteId, { type: 'device', startAt, endAt, limit: 8 }),
		client.getWebsiteMetrics(websiteId, { type: 'country', startAt, endAt, limit: 8 })
	]);

	if (!stats.ok || !stats.data) {
		throw new Error(stats.error?.toString() || 'Failed to load website stats');
	}

	const statsData = stats.data as unknown as WebsiteStatsResponse;
	const pageviewsData = pageviews.data as unknown as WebsitePageviewsResponse | undefined;

	return {
		stats: {
			pageviews: statsData.pageviews,
			visitors: statsData.visitors,
			visits: statsData.visits,
			bounces: statsData.bounces,
			totaltime: statsData.totaltime
		},
		pageviews: fillTimeSeries(startAt, endAt, unit, pageviewsData?.pageviews ?? []),
		visitors: fillTimeSeries(startAt, endAt, unit, pageviewsData?.sessions ?? []),
		topPages: toNamedCounts(pages.data as unknown as TimeSeriesPoint[]),
		referrers: toNamedCounts(referrers.data as unknown as TimeSeriesPoint[]),
		browsers: toNamedCounts(browsers.data as unknown as TimeSeriesPoint[]),
		devices: toNamedCounts(devices.data as unknown as TimeSeriesPoint[]),
		countries: toNamedCounts(countries.data as unknown as TimeSeriesPoint[])
	};
}
