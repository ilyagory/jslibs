"use strict";

class ApiError extends Error {
	constructor(json, status, statusText, ...a) {
		super(...a);
		this.json = json;
		this.status = status;
		this.statusText = statusText;
		Error.captureStackTrace(this, ApiError);
	}
}

function api(path, data, method) {
	const opt = {
		headers: {
			Accept: 'application/json, text/javascript, */*; q=0.01'
		},
		method: method
	};
	const jsonStat = [200, 201];

	if (api.config.prefix != null) {
		path = `${api.config.prefix}/${path}`;
	}

	if (data !== null) {
		if (data instanceof HTMLFormElement) {
			opt.body = new URLSearchParams(new FormData(data));
		} else if (data instanceof FormData) {
			opt.body = new URLSearchParams(data);
		} else if (method.toLowerCase() === 'get') {
			path = new URL(path, location.origin);
			let sp = path.searchParams;
			for (let k of Object.keys(data)) {
				sp.set(k, encodeURIComponent(data[k]));
			}
		} else {
			opt.body = data;
		}
	}

	return fetch(path, opt).catch(e=>{
		throw e;
	}).then(r => {
		if (r.redirected) {
			location.replace(r.url);
		}

		if (!r.ok)
			return r.json().then(e => {
				throw new ApiError(e, r.status, r.statusText);
			});


		if (jsonStat.includes(r.status)) {
			return r.json();
		}
	});
}

api.config = {
	prefix: null
};