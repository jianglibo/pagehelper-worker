import { Router } from 'itty-router';

const router = Router({
	base: '/ph-misc',
})

// curl post json value
// curl -X POST -H "Content-Type: application/json" -d '{"echo": "hello"}' http://localhost:8787/ph-misc/echo
// router.get("/jslint", async (request, { url, env }: { url: URL, env: Env }) => {

router.all("/echo", async (request, { url, env }: { url: URL, env: Env }) => {
	const { echo } = request.query
	let v
	let datapath = request.query['datapath']
	let isjv = false
	if (echo) {
		try {
			v = JSON.parse(echo + '')
			isjv = true
		} catch (error) {
			v = echo + ''
		}
	} else {
		if (request.method === 'POST') {
			const body = await request.text()
			if (body) {
				try {
					v = JSON.parse(body)
					isjv = true
					if (!datapath) {
						datapath = v.datapath
					}
				} catch (error) {
					v = body
				}
			}
		}
		if (!v) {
			v = {
				url: url.href,
				headers: request.headers,
			}
			isjv = true
		}
	}
	if (isjv) {
		let echoJson = v
		if (v.echo) {
			if (typeof v.echo === 'string') {
				try {
					echoJson = JSON.parse(v.echo);
				} catch (error) {
				}
			} else {
				echoJson = v.echo
			}
		}
		if (datapath) {
			let dp = (datapath + '').split('.')
			for (let i = 0; i < dp.length; i++) {
				if (echoJson[dp[i]]) {
					echoJson = echoJson[dp[i]]
				} else {
					break
				}
			}
		}
		return Response.json(echoJson)
	} else {
		return new Response(v)
	}
})

export default router;
