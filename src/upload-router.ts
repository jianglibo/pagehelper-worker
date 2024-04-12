import { Router, error, json, withParams } from 'itty-router';


const router = Router({
	base: '/upload',
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

async function putBlob(env: Env, bucket: R2Bucket, body: string | ReadableStream<any> | ArrayBuffer | ArrayBufferView | Blob | null, originFileName: string, fileext: string, request: Request, key?: string) {

	const cus: Record<string, string> = {}
	const random32alphadigits = Math.random().toString(36).substring(2, 34)
	key = key || `${originFileName}.${Date.now()}.${random32alphadigits}.${fileext}`
	if (!authorizeRequest(request, env, key)) {
		key = `/anonymous/${key}`
	}
	console.log('put bucket.')
	await bucket.put(key, body, { httpMetadata: request.headers, customMetadata: cus });
	return new Response(JSON.stringify({
		key,
		url: `https://pagehelper.lets-script.com/get-file/${key}`,
		originFileName: originFileName
	}), {
		headers: {
			'Content-Type': 'application/json',
		},
	});
}
router.all("/r2-blob", async (request, { url, env }: { url: URL, env: Env }) => {
	const bucket = env.AJAX_UPLOAD_DEMO_BUCKET;

	const { filename, fileext, key } = request.query

	switch (request.method) {
		case 'PUT':
			return putBlob(env, bucket, request.body, filename + '', fileext + '', request, key + '')
		case 'GET':
			const object = await bucket.get(key + '');
			if (object === null) {
				return new Response('Object Not Found', { status: 404 });
			}

			const headers = new Headers();
			object.writeHttpMetadata(headers);
			headers.set('etag', object.httpEtag);
			return new Response(object.body, {
				headers,
			});
		case 'DELETE':
			await bucket.delete(key + '');
			return new Response('Deleted!');

		default:
			return new Response('Method Not Allowed', {
				status: 405,
				headers: {
					Allow: 'PUT, GET, DELETE',
				},
			});
	}

})

router.all("/r2-multipart", async (request, { url, env }: { url: URL, env: Env }) => {
	const formData = await request.formData();

	// assume there's only one file.

	const allItems: [string, FormDataEntryValue][] = []
	formData.forEach((formItemValue, formItemKey) => {
		allItems.push([formItemKey, formItemValue])
	})

	let fileItem = allItems.find(item => item[1] instanceof File)
	let keyItem = allItems.find(item => item[0] === 'key')

	if (fileItem) {
		const file = fileItem[1] as File
		const key = keyItem ? keyItem[1] + '' : undefined
		let name = file.name
		// take the name after lastslash
		const originFileName = name.split('/').pop();
		const ext = name.split('.').pop();
		return putBlob(env, env.AJAX_UPLOAD_DEMO_BUCKET, file, originFileName + '', ext + '', request, key)
	} else {
		return new Response('No file found', { status: 400 })
	}
})

router.all("/r2-multislice", async (request, { url, env }: { url: URL, env: Env }) => {
	const bucket = env.AJAX_UPLOAD_DEMO_BUCKET;
	let key = url.pathname.slice(1);
	const action = url.searchParams.get("action");

	if (!authorizeRequest(request, env, key)) {
		return new Response('Forbidden', { status: 403 });
	}

	if (action === null) {
		return new Response("Missing action type", { status: 400 });
	}
	// Route the request based on the HTTP method and action type
	switch (request.method) {
		case "POST":
			switch (action) {
				// {"key":"upload/","uploadId":"6fEP9oVB1AMIbT2Q9cdRLS2-WTe0-vsd7Ew1uMULrh1VVwR1BDxedoHKtxH-ijFtUknWUH9z1h01IE7gw1IqiVMzQ4JtDbRfn0f-b_fuVHTmLbQ_XySDLYv5U5P01Bw1i-v03StYlUOvUtqlJX8ZJSMpOXAcH-WObrh8WWV6Uas"}
				case "mpu-create": {
					const multipartUpload = await bucket.createMultipartUpload(key);
					return new Response(
						JSON.stringify({
							key: multipartUpload.key,
							uploadId: multipartUpload.uploadId,
						})
					);
				}
				case "mpu-complete": {
					const uploadId = url.searchParams.get("uploadId");
					if (uploadId === null) {
						return new Response("Missing uploadId", { status: 400 });
					}

					const multipartUpload = env.AJAX_UPLOAD_DEMO_BUCKET.resumeMultipartUpload(
						key,
						uploadId
					);

					interface completeBody {
						parts: R2UploadedPart[];
					}
					const completeBody: completeBody = await request.json();
					if (completeBody === null) {
						return new Response("Missing or incomplete body", {
							status: 400,
						});
					}

					// Error handling in case the multipart upload does not exist anymore
					try {
						const object = await multipartUpload.complete(completeBody.parts);
						return new Response(null, {
							headers: {
								etag: object.httpEtag,
							},
						});
					} catch (error: any) {
						return new Response(error.message, { status: 400 });
					}
				}
				default:
					return new Response(`Unknown action ${action} for POST`, {
						status: 400,
					});
			}
		case "PUT":
			switch (action) {
				case "mpu-uploadpart": {
					const uploadId = url.searchParams.get("uploadId");
					const partNumberString = url.searchParams.get("partNumber");
					if (partNumberString === null || uploadId === null) {
						return new Response("Missing partNumber or uploadId", {
							status: 400,
						});
					}
					if (request.body === null) {
						return new Response("Missing request body", { status: 400 });
					}

					const partNumber = parseInt(partNumberString);
					const multipartUpload = env.AJAX_UPLOAD_DEMO_BUCKET.resumeMultipartUpload(
						key,
						uploadId
					);
					// {"partNumber":1,"etag":"71BxsQTUX2hbt3FfOd5Nd7ga8t3dbh22zQ0_N2v63R1d1cgUC4cFja2MWBpV79AE_HqxIhn4ThnY69shI4RMtufkZpLPtE7hSxxqkylgcil6_f5zhGDqqmnlriemygKD2mRmPhsOvJd-AOHvQJGpPVHiVrQILwgdSkTJM1Ux11Q"}
					try {
						const file = (await request.formData()).get('file') as File
						console.log(file)
						const uploadedPart: R2UploadedPart =
							await multipartUpload.uploadPart(partNumber, file);
						return new Response(JSON.stringify(uploadedPart));
					} catch (error: any) {
						return new Response(error.message, { status: 400 });
					}
				}
				default:
					return new Response(`Unknown action ${action} for PUT`, {
						status: 400,
					});
			}
		case "GET":
			if (action !== "get") {
				return new Response(`Unknown action ${action} for GET`, {
					status: 400,
				});
			}
			const object = await env.AJAX_UPLOAD_DEMO_BUCKET.get(key);
			if (object === null) {
				return new Response("Object Not Found", { status: 404 });
			}
			const headers = new Headers();
			object.writeHttpMetadata(headers);
			headers.set("etag", object.httpEtag);
			return new Response(object.body, { headers });
		case "DELETE":
			switch (action) {
				case "mpu-abort": {
					const uploadId = url.searchParams.get("uploadId");
					if (uploadId === null) {
						return new Response("Missing uploadId", { status: 400 });
					}
					const multipartUpload = env.AJAX_UPLOAD_DEMO_BUCKET.resumeMultipartUpload(
						key,
						uploadId
					);

					try {
						multipartUpload.abort();
					} catch (error: any) {
						return new Response(error.message, { status: 400 });
					}
					return new Response(null, { status: 204 });
				}
				case "delete": {
					await env.AJAX_UPLOAD_DEMO_BUCKET.delete(key);
					return new Response(null, { status: 204 });
				}
				default:
					return new Response(`Unknown action ${action} for DELETE`, {
						status: 400,
					});
			}
		default:
			return new Response("Method Not Allowed", {
				status: 405,
				headers: { Allow: "PUT, POST, GET, DELETE" },
			});
	}
})





export default router;
