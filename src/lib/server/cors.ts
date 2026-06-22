import { env } from '$env/dynamic/private';

export function corsHeaders(): Record<string, string> {
	return {
		'Access-Control-Allow-Origin': env.CORS_ORIGIN || '*',
		'Access-Control-Allow-Methods': 'GET, OPTIONS',
		'Access-Control-Allow-Headers': 'Content-Type'
	};
}
