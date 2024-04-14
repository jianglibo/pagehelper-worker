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

router.get("/:key+", async (request, { url, env }: { url: URL, env: Env }) => {
	const bucket = env.AJAX_UPLOAD_DEMO_BUCKET;

	let key = request.params.key

	if (key.startsWith('get-file/')) {
		key = url.pathname.slice(10)
	}
	const object = await bucket.get(key);
	if (object === null) {
		return new Response('Object Not Found', { status: 404 });
	}
	const headers = new Headers();
	object.writeHttpMetadata(headers);
	headers.set('etag', object.httpEtag);
	return new Response(object.body, {
		headers,
	});
})

export default router;
