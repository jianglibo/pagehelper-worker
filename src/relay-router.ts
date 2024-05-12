import { Router, error, json, withParams } from 'itty-router';


const router = Router({
	base: '/relay',
	before: [withParams],
})


router.get("", async (request, { url, env }: { url: URL, env: Env }) => {
	let targetFile = request.query.url
	if (targetFile) {
		// fetch the target file and stream to the client
		let response = await fetch(new URL(targetFile + ''))
		let headers = new Headers(response.headers)
		headers.set('Access-Control-Allow-Origin', '*')
		return new Response(
			new ReadableStream({
				start(controller) {
					const reader = response.body?.getReader();
					if (!reader) {
						controller.close();
						return;
					}
					const pump = () => reader.read().then(({ done, value }) => {
						if (done) {
							controller.close();
							return;
						}
						controller.enqueue(value);
						pump();
					});
					pump();
				}
			}),
			{
				status: response.status,
				headers
			})
	}

})



export default router;
