import { IRequest, Router, error } from 'itty-router';
import cookie from 'cookie';
import cryptoUtil from './crypto-util';
import { Customer } from './upload-router';

const router = Router({
	base: '/d1',
})

const COOKIE_NAME = "__uploader";

function prepareUploadCookie() {
	return cookie.serialize(COOKIE_NAME, '', {
		maxAge: 0,
		path: '/upload',
		sameSite: 'none',
		httpOnly: true,
	})
}

const withAuthenticatedUser = async (request: IRequest, { env, url }: { env: Env, url: URL }) => {
	console.log("env in middleware:", env)
	if (!(request.headers.get("x-api-key") === env.D1_ADMIN_KEY)) {
		return error(401, 'Unauthorized: Invalid token')
	}
}

// middleware
router.all('*', withAuthenticatedUser)
// curl -H "X-Api-Key: lksdk0923klds" http://localhost:8787/d1/list

router.all("/list", async (request, { url, env }: { url: URL, env: Env }) => {
	// If you did not use `DB` as your binding name, change it here
	const { results } = await env.UPLOADER_DB.prepare(
		"SELECT * FROM Customers")
		.all<Customer>();
	return Response.json({ data: results })
})

// curl to request this point
// curl -X POST -H "X-Api-Key: lksdk0923klds" -H "Content-Type: application/json" -d '{"uid":"u12", "phApiKey":"test"}' http://localhost:8787/d1/create
router.post("/create", async (request: Request, { url, env }: { url: URL, env: Env }) => {
	const oneYearLater = new Date().getTime() + 365 * 24 * 60 * 60 * 1000
	const { uid, phApiKey } = (await request.json()) as any;
	const result = await env.UPLOADER_DB.prepare(
		"INSERT INTO Customers (uid, phApiKey, apiKeyExpireAt) VALUES (?, ?, ?)"
	).bind(uid, phApiKey, oneYearLater)
		.all();

	const newAdded = await env.UPLOADER_DB.prepare("SELECT * FROM Customers WHERE id = ?")
		.bind(result.meta.last_row_id)
		.all();

	return new Response(JSON.stringify({ data: newAdded }), {
		headers: {
			"content-type": "application/json",
		},
	});
})

// curl -X DELETE -H  "X-Api-Key: lksdk0923klds" "http://localhost:8787/d1?uid=u123"
router.delete("", async (request, { url, env }: { url: URL, env: Env }) => {
	const { uid } = request.query;
	const result = await env.UPLOADER_DB.prepare(
		"DELETE FROM Customers WHERE uid = ?"
	).bind(uid)
		.run();

	return new Response(JSON.stringify({ data: result }), {
		headers: {
			"content-type": "application/json",
		},
	});
})
/**
 * will create a session id after login, keep it in D1.
 */
router.all("/cookie", async (request: Request, { url, env }: { url: URL, env: Env }) => {
	// The name of the cookie
	const cookieValue = cookie.parse(request.headers.get("Cookie") || "");
	if (cookieValue[COOKIE_NAME] != null) {
		// Respond with the cookie value
		return new Response(cookieValue[COOKIE_NAME], {
			headers: {
				"Set-Cookie": prepareUploadCookie()
			},
		});
	}


	// return new Response("No cookie with name: " + COOKIE_NAME);
})
// curl to accees this point
// curl http://localhost:8787/upload/d1/encrypt?data=hello&password=world
router.get("/encrypt", async (request, { url, env }: { url: URL, env: Env }) => {
	const { data, password } = request.query
	const result = { data: await cryptoUtil.encryptData(data as string, password as string) }
	return new Response(JSON.stringify(result), {
		headers: {
			"content-type": "application/json",
		}
	});
})

// curl 'http://localhost:8787/upload/d1/decrypt?data=l86Xx7d6FzoWXgtVNSLN00xqZreQufr5DBAPzJVLdul0b+gbLG2rxHdoUqOL1r0dLA==&password=world'
router.get("/decrypt", async (request, { url, env }: { url: URL, env: Env }) => {
	const { data, password } = request.query
	const result = { data: await cryptoUtil.decryptData(data as string, password as string) }
	return new Response(JSON.stringify(result), {
		headers: {
			"content-type": "application/json",
		}
	});
})


export default router;
