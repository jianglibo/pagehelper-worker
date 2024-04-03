/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `npm run dev` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `npm run deploy` to publish your worker
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */

import handleProxy from './proxy';
import handleRedirect from './redirect';
import apiRouter from './router';

type WantDataType = 'json' | 'text'

// Export a default object containing event handlers
export default {
	// The fetch handler is invoked when this worker receives a HTTP(S) request
	// and should return a Response (optionally wrapped in a Promise)
	async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
		// You'll find it helpful to parse the request.url string into a URL object. Learn more at https://developer.mozilla.org/en-US/docs/Web/API/URL
		const url = new URL(request.url);

		const phIdHeader = request.headers.get('Ph-Id');
		const phGroupIdHeader = request.headers.get('Ph-Group-Id');

		const { searchParams, pathname } = new URL(request.url)

		if ('fixtures/group-response' === pathname) {
			const __changed_value = searchParams.get('__changed_value')
			const wantType = searchParams.get('wantType') as WantDataType || 'json'
			const want = searchParams.get('want')

			if (wantType === 'json') {
				return new Response(JSON.stringify({ data: { __changed_value } }), {
					headers: {
						'Content-Type': 'application/json',
						'Ph-Id': phIdHeader || '',
						'Ph-Group-Id': phGroupIdHeader || '',
					}
				})
			} else {
				return new Response(__changed_value, {
					headers: {
						'Content-Type': 'text/plain',
						'Ph-Id': phIdHeader || '',
						'Ph-Group-Id': phGroupIdHeader || '',
					}
				})
			}
		}
		let res = await fetch(request)
		if (phIdHeader || phGroupIdHeader) {
			res = new Response(res.body, res);
			if (phIdHeader)
				res.headers.set('Ph-Id', phIdHeader);
			if (phGroupIdHeader)
				res.headers.set('Ph-Group-Id', phGroupIdHeader);
		}
		return res
		// You can get pretty far with simple logic like if/switch-statements
	},
};
