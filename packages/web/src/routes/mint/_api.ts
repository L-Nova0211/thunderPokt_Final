const base = 'https://api.coingecko.com/api/v3';

export function api(method: string, resource: string, data?: Record<string, unknown>) {
	return fetch(`${base}/${resource}`, {
		method,
		headers: {
			'content-type': 'application/json',
			accept: 'application/json'
		},
		body: data && JSON.stringify(data)
	});
}
