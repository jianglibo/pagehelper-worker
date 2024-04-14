import { Router } from 'itty-router';
import { appendCorsHeaders } from '.';

export type Customer = {
	id: string;
	uid: string;
	phApiKey: string;
	apiKeyExpireAt: number,
	createAt: number;
}
// {"data":{"id":543,"name":"R2-Uploader-Key","maxusages":null,"willExpireInSeconds":null,"password":null,"scope":"r2uploader;","will_expire_at":"2025-04-13T01:32:49.213969Z","user_id":30,"created_at":"2024-04-13T01:32:49.213969Z"}}
// create the type for json above
type ApiKeyVerifyResult = {
	willExpireAt: number;
	uid: number;
}

const router = Router({
	base: '/upload',
})

async function getCustomerByPhApikey(phApiKey: string, env: Env) {
	const result = await env.UPLOADER_DB.prepare(
		"SELECT * FROM Customers WHERE phApiKey = ?"
	).bind(phApiKey)
		.all<Customer>();
	if (result?.results?.length > 0) {
		const customer = result.results[0]
		if (customer.apiKeyExpireAt > Date.now()) {
			return result.results[0]
		}
	} else {
		console.log("start to verify.")
		return await verifyApiKey(phApiKey, env)
	}
}

async function calKey(originFileName: string, fileext: string, apikey: string, env: Env, key?: string) {
	const random32alphadigits = Math.random().toString(36).substring(2, 34)
	key = key || `${originFileName}.${Date.now()}.${random32alphadigits}.${fileext}`
	// const apikey = request.headers.get('Ph-Api-Key')
	if (!apikey || apikey.length < 34) {
		key = `anonymous/${key}`
	} else {
		console.log("start fetch Customer by apikey:", apikey)
		const customer = await getCustomerByPhApikey(apikey, env)
		console.log("done fetch Customer by apikey:", customer)
		if (!customer) {
			key = `anonymous/${key}`
		} else {
			key = `${customer.uid}/${key}`
		}
	}

	return key

}

async function putBlob(env: Env, bucket: R2Bucket,
	body: string | ReadableStream<any> | ArrayBuffer | ArrayBufferView | Blob | null,
	originFileName: string,
	fileext: string,
	request: Request,
	key?: string) {

	const cus: Record<string, string> = {}
	key = await calKey(originFileName, fileext, request.headers.get('Ph-Api-Key') as string, env, key)

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


async function verifyApiKey(apikey: string, env: Env) {
	const query = new URLSearchParams()
	query.set("scope", "r2uploader");
	const toFetchUrl = env.VERIFY_ENDPOINT + '?' + query.toString()
	// 'Ph-Api-Key': "543-zKx753TgTGXWvtRJP9IgE7-Dy0MuaOX9",
	console.log("start invoke fetch to lets-script.com")
	const res = await fetch(toFetchUrl, {
		method: 'GET',
		headers: {
			'Ph-Api-Key': apikey,
		}
	})
	const v = await res.json() as { data: ApiKeyVerifyResult }
	console.log("got the verify result:", v)
	if (v) {
		const result = await env.UPLOADER_DB.prepare(
			"INSERT INTO Customers (uid, phApiKey, apiKeyExpireAt) VALUES (?, ?, ?)"
		).bind(v.data.uid, apikey, v.data.willExpireAt)
			.all<Customer>();

		const newAdded = await env.UPLOADER_DB.prepare("SELECT * FROM Customers WHERE id = ?")
			.bind(result.meta.last_row_id)
			.all();

		console.log("insert Customer table result:", newAdded)
		if (newAdded?.results?.length > 0) {
			return newAdded.results[0]
		}
	}
}
// curl to this endpoint, with header and query
// curl -H "Ph-Api-Key: secret key" http://lets-script.com/apikey/verify?scope=r2uploader

router.get("/apikey", async (request, { url, env }: { url: URL, env: Env }) => {
	if (await verifyApiKey(request.headers.get('Ph-Api-Key') as string, env)) {
		return new Response(JSON.stringify("ok"), {
			headers: appendCorsHeaders(request)
		})
	} else {
		const respData = {
			data: [
				{
					"action": "TOAST",
					"params": {
						"toast": {
							"icon": "warn",
							"title": "Invalid Apikey.",
							"timer": 3000
						}
					}
				},
			]
		}
		return new Response(JSON.stringify(respData), {
			headers: appendCorsHeaders(request)
		})
	}
})

router.all("/r2-blob", async (request, { url, env }: { url: URL, env: Env }) => {
	const bucket = env.AJAX_UPLOAD_DEMO_BUCKET;

	const { filename, fileext, key } = request.query

	const ext = (filename === fileext) ? '' : fileext as string

	switch (request.method) {
		case 'PUT':
			return putBlob(env, bucket, request.body, filename as string, ext, request, key as string)
		case 'GET':
			const object = await bucket.get(key as string);
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
		let key = keyItem ? keyItem[1] as string : undefined
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

	// if (!authorizeRequest(request, env, key)) {
	// 	return new Response('Forbidden', { status: 403 });
	// }

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
