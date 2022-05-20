import { SushiUrl } from '$lib/constants';
import type { RequestHandler } from '@sveltejs/kit';

export const get: RequestHandler = async () => {
	return {
		status: 302,
		headers: {
			location: SushiUrl
		}
	};
};
