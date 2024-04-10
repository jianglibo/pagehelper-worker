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

export type WantType = 'map' | 'list' | 'raw'

// Export a default object containing event handlers
export default {
	// The fetch handler is invoked when this worker receives a HTTP(S) request
	// and should return a Response (optionally wrapped in a Promise)
	async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
		// You'll find it helpful to parse the request.url string into a URL object. Learn more at https://developer.mozilla.org/en-US/docs/Web/API/URL


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
		} else {
			res = await fetch(request)
		}

		if (phIdHeader || phGroupIdHeader) {
			const nh = new Headers(res.headers)
			if (phIdHeader)
				nh.set('Ph-Id', phIdHeader)
			// append this header to immuatable response
			if (phGroupIdHeader)
				nh.set('Ph-Group-Id', phGroupIdHeader)
			return new Response(res.body, {
				status: res.status,
				statusText: res.statusText,
				headers: nh,
			})
		}
		return res
	},
};
