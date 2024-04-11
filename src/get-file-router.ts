import { Router, error, json, withParams } from 'itty-router';


const router = Router({
	base: '/get-file',
	before: [withParams],
})

const hasValidHeader = (request: Request, env: Env) => {
	return request.headers.get('X-Custom-Auth-Key') === env.AUTH_AJAX_UPLOAD_SECRET;
};

function authorizeRequest(request: Request, env: Env, key: string) {
	switch (request.method) {
		case 'PUT':
		case 'DELETE':
		case 'GET':
			return hasValidHeader(request, env);
		default:
			return false;
	}
}
router.all("/:key", async (request, { url, env }: { url: URL, env: Env }) => {
	const bucket = env.AJAX_UPLOAD_DEMO_BUCKET;

	const key = request.params.key

	switch (request.method) {
		case 'GET':
			const object = await bucket.get(key);

			if (object === null) {
				return new Response('Object Not Found', { status: 404 });
			}
			const headers = new Headers();
			// if (object.httpMetadata) {
			// 	Object.entries(object.httpMetadata)
			// 		.forEach(([k, v]) => {
			// 			headers.set(k, v)
			// 		})
			// }
			object.writeHttpMetadata(headers);
			headers.set('etag', object.httpEtag);
			return new Response(object.body, {
				headers,
			});
		default:
			return new Response('Method Not Allowed', {
				status: 405,
				headers: {
					Allow: 'GET',
				},
			});
	}

})

export default router;
