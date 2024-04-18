/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `npm run dev` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `npm run deploy` to publish your worker
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */

import fixturesRoute from './fixture-router';
import highlightRoute from './highlight-router'
import uploadRoute from './upload-router'
import getFileRoute from './get-file-router'
import d1Reoute from './d1-endpoint'
import completionRoute from "./completion-endpoint"
import relayRoute from './relay-router'
import phmiscRoute from "./ph-misc"

export type WantType = 'map' | 'list' | 'raw'

export function appendCorsHeaders(request: Request, headers?: Headers) {
	let nh = headers || new Headers()
	nh.set('Access-Control-Allow-Origin', request.headers.get('Origin') || '*')
	nh.set('Access-Control-Allow-Credentials', 'true')
	nh.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
	nh.set('Access-Control-Allow-Headers', '*')
	return nh
}

async function doSche(env: Env) {
	const bucket = env.AJAX_UPLOAD_DEMO_BUCKET
	const options = {
		limit: 500,
		prefix: 'anonymous/',
		// include: ['customMetadata'],
	} as R2ListOptions

	let next: R2Objects = await bucket.list(options);

	let truncated = next.truncated;
	let cursor
	if (truncated) {
		cursor = (next as any).cursor
	} else {
		cursor = undefined
	}

	await bucket.delete(next.objects.map(obj => obj.key))

	while (truncated) {
		next = await bucket.list({
			...options,
			cursor: cursor,
		});
		// listed.objects.push(...next.objects);
		truncated = next.truncated;
		cursor = (next as any).cursor
		await bucket.delete(next.objects.map(obj => obj.key))
	}
	console.log('clean work donw.')
}

// Export a default object containing event handlers
export default {
	async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext) {
		ctx.waitUntil(doSche(env));
	},
	// The fetch handler is invoked when this worker receives a HTTP(S) request
	// and should return a Response (optionally wrapped in a Promise)
	async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
		// You'll find it helpful to parse the request.url string into a URL object. Learn more at https://developer.mozilla.org/en-US/docs/Web/API/URL
		// console.log("entrypoint env: ", env)
		// if the method is option, return allow cors headers
		if (request.method === 'OPTIONS') {
			return new Response(null, {
				headers: appendCorsHeaders(request),
			})
		}

		// return new Response('ok')
		const url = new URL(request.url);
		// return new Response('ok')
		// return fixturesRoute.fetch(request)

		const phIdHeader = request.headers.get('Ph-Id');
		const phGroupIdHeader = request.headers.get('Ph-Group-Id');

		const isPjax = request.headers.has('Ph-Pjax-Request')
		const xRequestWith = request.headers.get('X-Requested-With')


		if (url.pathname.indexOf('/ph-ajax/') !== -1 && !isPjax && xRequestWith === 'XMLHttpRequest') {
			// if (url.pathname.indexOf('/ph-ajax/') !== -1) {
			const pageStr = url.searchParams.get('page') || "1"
			const sizeStr = url.searchParams.get('size') || "10"
			const page = parseInt(pageStr)
			const size = parseInt(sizeStr)

			const items = Array.from({ length: size }, (_, i) => {
				return {
					id: i + (page - 1) * size,
					task: `Item ${i + (page - 1) * size}`,
					dueDate: '2021-01-01',
					priority: 'high'
				}
			})
			const respData = {
				data: items
			}
			return new Response(JSON.stringify(respData), {
				headers: {
					'Content-Type': 'application/json'
				}
			})
		}

		let res

		if (url.pathname.startsWith('/fixtures')) {
			res = await fixturesRoute.fetch(request, { url })
		} else if (url.pathname.startsWith('/highlight')) {
			res = await highlightRoute.fetch(request)
		} else if (url.pathname.startsWith('/upload')) {
			res = await uploadRoute.fetch(request, { url, env })
		} else if (url.pathname.startsWith('/get-file')) {
			res = await getFileRoute.fetch(request, { url, env })
		} else if (url.pathname.startsWith('/d1')) {
			res = await d1Reoute.fetch(request, { url, env })
		} else if (url.pathname.startsWith('/relay')) {
			res = await relayRoute.fetch(request, { url, env })
		} else if (url.pathname.startsWith('/completions')) {
			res = await completionRoute.fetch(request, { url, env })
		} else if (url.pathname.startsWith('/ph-misc')) {
			res = await phmiscRoute.fetch(request, { url, env })
		} else if (url.pathname.startsWith('/linters/')) {
			const destinationURL = 'https://worker-1.lets-script.com' + url.pathname
			// Forward the request to the destination URL
			res = await fetch(destinationURL, {
				method: request.method,
				headers: request.headers,
				body: request.body
			})
		} else {
			res = await fetch(request)
		}

		if (res) {
			const resHeaders = res && new Headers(res.headers) || new Headers()
			if (phIdHeader || phGroupIdHeader) {
				if (phIdHeader)
					resHeaders.set('Ph-Id', phIdHeader)
				// append this header to immuatable response
				if (phGroupIdHeader)
					resHeaders.set('Ph-Group-Id', phGroupIdHeader)
			}
			console.log('response body:', res.body)
			return new Response(res.body, {
				status: res.status,
				statusText: res.statusText,
				headers: appendCorsHeaders(request, resHeaders),
			})
		} else {
			return new Response('res is null', {
				headers: appendCorsHeaders(request)
			})
		}
	},
};
