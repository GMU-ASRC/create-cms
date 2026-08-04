import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { getAnalytics } from '$lib/server/analytics';

const hour = 60 * 60 * 1000;
const day = 24 * hour;

const presets = ['24h', '7d', '30d'] as const;
type Preset = (typeof presets)[number];

const presetSpan: Record<Preset, number> = {
	'24h': day,
	'7d': 7 * day,
	'30d': 30 * day
};

const defaultPreset: Preset = '30d';

function isPreset(value: string | null): value is Preset {
	return presets.includes(value as Preset);
}

export const load: PageServerLoad = async ({ locals, url }) => {
	if (!locals.user) {
		redirect(303, '/login');
	}

	const rangeParam = url.searchParams.get('range');
	const startParam = url.searchParams.get('start');
	const endParam = url.searchParams.get('end');

	let startAt: number;
	let endAt: number;
	let range: string;

	if (rangeParam === 'custom' && startParam && endParam) {
		startAt = new Date(startParam).getTime();
		endAt = new Date(endParam).getTime() + day - 1;
		range = 'custom';
	} else {
		const preset = isPreset(rangeParam) ? rangeParam : defaultPreset;
		endAt = Date.now();
		startAt = endAt - presetSpan[preset];
		range = preset;
	}

	const unit = endAt - startAt <= day ? 'hour' : 'day';

	try {
		const analytics = await getAnalytics(startAt, endAt, unit);
		return { analytics, range, unit, start: startParam ?? '', end: endParam ?? '', error: null };
	} catch (analyticsError) {
		return {
			analytics: null,
			range,
			unit,
			start: startParam ?? '',
			end: endParam ?? '',
			error: (analyticsError as Error).message
		};
	}
};
