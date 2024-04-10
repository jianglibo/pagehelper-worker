import { Router, error, json, withParams } from 'itty-router';
import { WantType } from '.';

// now let's create a router (note the lack of "new")
// const router = Router();

interface ResponseDataItem {
	action: 'PUSH_STATE' | 'SET_VALUE' |
	'APPEND_CLASSES' | 'REMOVE_NODE' |
	'INSERT_HTML' | 'REPLACE_NODE' | 'DELETE_ROWS' |
	'REDIRECT' | 'RELOAD' | 'TOAST' | 'SWAL2' |
	'INNER_HTML' | 'RESET_FORM' | 'FAILED_VALIDATES',
	params: { [key: string]: any }
}

export type HasHtmlResponse = {
	html?: string,
	model?: { [key: string]: any },
}


const router = Router({
	base: '/fixtures',
	// before: [withParams],
	// catch: error,
	// finally: [json],
})

type EmailAndPassword = {
	email: string
	password: string
}

const demodata = {
	a: [1, 2, 3],
	b: [4, 5, 6],
	c: [7, 8, 9]
} as Record<string, number[]>

function idResponse(request: Request, url: URL) {
	const ids = url.searchParams.get('ids')?.split(',') || []
	const name = request.headers.get('Ph-Selector-Name') || 'unknown'
	const idwithnames = ids.map((it: string) => {
		return { id: parseInt(it), name }
	})
	const respData = {
		data: [
			{
				"action": "TOAST",
				"params": {
					"toast": {
						"icon": "success",
						"title": "Deleted.",
						"timer": 3000
					}
				}
			},
			{
				"action": "DELETE_ROWS",
				"params": {
					ids: idwithnames
				}
			}
		]
	}

	return new Response(JSON.stringify(respData), {
		headers: {
			'Content-Type': 'application/json'
		}
	})
}

function mangeData(action: string, selector: string | null) {
	const data: { data: ResponseDataItem[] } = {
		"data": [
			{
				action: 'INNER_HTML',
				params: {
					selector: selector || 'this',
					model: {
						"items": [{
							"id": "dockerps",
							"name": "name",
							"cat": "category",
							"action": action || 'index',
							"actions": ["start", "stop", "rm"],
							"data": {
								"image": "ubuntu:22.04",
								"name": "magical_tesla",
								"State": "Exited"
							}
						}]
					}
				}
			}
		]
	}
	return data
}



router.delete("/todo", (request, { url }) => {
	return idResponse(request, url)
})



router.post("/ph-form", async (request, { url }) => {
	const requestBody = await request.json()
	const { email, password } = requestBody as EmailAndPassword
	// validate email by regex
	const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
	// password shoud has length 6 - 32
	const isValidPassword = password.length >= 6 && password.length <= 32

	const respData = {
		"data": [
			{
				"action": "FAILED_VALIDATES",
				"params": {
					"failedValidates": []
				}
			},
			{
				"action": "TOAST",
				"params": {
					"toast": {
						"icon": "warning",
						"title": "validate failed.",
						"timer": 3000
					}
				}
			}
		]
	}

	if (!isValidEmail) {
		(respData.data[0].params?.failedValidates as { name: string, message: string }[]).push(
			{
				"name": "email",
				"message": "it's not a valid email."
			}
		)
	}
	if (!isValidPassword) {
		(respData.data[0].params?.failedValidates as { name: string, message: string }[]).push(
			{
				"name": "password",
				"message": "length should between 6 - 32"
			}
		)
	}
	return new Response(JSON.stringify(respData), {
		headers: {
			'Content-Type': 'application/json'
		}
	})
})

router.get("/todo", (request, { url }) => {
	return idResponse(request, url)
})

router.get("/data-consumer", (req: Request, { url }) => {
	return new Response(JSON.stringify({
		data: [
			{
				id: 1,
				name: 'A'
			},
			{
				id: 2,
				name: 'B'
			},
			{
				id: 3,
				name: 'C'
			}
		]
	}));
})

router.get("/toast", (request: Request, { url }) => {
	const position = url.searchParams.get('position') as string || ''
	const toast = url.searchParams.get('toast')
	let item
	if (toast) {
		item = {
			"action": "TOAST",
			"params": {
				"toast": {
					"position": position || "top-end",
					"icon": "warning",
					"title": "validate failed.",
					"timer": 3000
				}
			}
		}
	} else {
		item = {
			"action": "SWAL2",
			"params": {
				"swal2": {
					"icon": "info",
					"title": "Deploy Outputs",
					"text": "executing ./deploy.sh\nuser letsscript exists\nsudo: a terminal is required to read the password; either use the -S option to read from standard input or configure an askpass helper\nsudo: a password is required\nsudo: a terminal is required to read the password; either use the -S option to read from standard input or configure an askpass helper\nsudo: a password is required\nsudo: a terminal is required to read the password; either use the -S option to read from standard input or configure an askpass helper\nsudo: a password is required\nsudo: a terminal is required to read the password; either use the -S option to read from standard input or configure an askpass helper\nsudo: a password is required\nsudo: a terminal is required to read the password; either use the -S option to read from standard input or configure an askpass helper\nsudo: a password is required\nsudo: a terminal is required to read the password; either use the -S option to read from standard input or configure an askpass helper\nsudo: a password is required\nsudo: a terminal is required to read the password; either use the -S option to read from standard input or configure an askpass helper\nsudo: a password is required\nsudo: a terminal is required to read the password; either use the -S option to read from standard input or configure an askpass helper\nsudo: a password is required\nsudo: a terminal is required to read the password; either use the -S option to read from standard input or configure an askpass helper\nsudo: a password is required\nsudo: a terminal is required to read the password; either use the -S option to read from standard input or configure an askpass helper\nsudo: a password is required\nCreate unit file: /etc/systemd/system/demoserverbg.service\nsudo: a terminal is required to read the password; either use the -S option to read from standard input or configure an askpass helper\nsudo: a password is required\nsudo: a terminal is required to read the password; either use the -S option to read from standard input or configure an askpass helper\nsudo: a password is required\nCreate env file: /etc/demoserverbg/env\nsudo: a terminal is required to read the password; either use the -S option to read from standard input or configure an askpass helper\nsudo: a password is required\nsudo: a terminal is required to read the password; either use the -S option to read from standard input or configure an askpass helper\nsudo: a password is required\nsudo: a terminal is required to read the password; either use the -S option to read from standard input or configure an askpass helper\nsudo: a password is required\nsudo: a terminal is required to read the password; either use the -S option to read from standard input or configure an askpass helper\nsudo: a password is required\nStart demoserverbg.service\nsudo: a terminal is required to read the password; either use the -S option to read from standard input or configure an askpass helper\nsudo: a password is required\nlast exit code: 1\ndemoserverbg is running.\nbase64: invalid input\nsudo: a terminal is required to read the password; either use the -S option to read from standard input or configure an askpass helper\nsudo: a password is required\nsudo: a terminal is required to read the password; either use the -S option to read from standard input or configure an askpass helper\nsudo: a password is required\nsudo: a terminal is required to read the password; either use the -S option to read from standard input or configure an askpass helper\nsudo: a password is required\nsudo: a terminal is required to read the password; either use the -S option to read from standard input or configure an askpass helper\nsudo: a password is required\nread process output done.\nexitCode:1",
					"wrap": "<pre><code>////</code><pre>"
				}
			}
		}
	}
	return new Response(JSON.stringify({ data: [item] }))
})


router.get("/manage", (request, { url }) => {
	const action = url.searchParams.get('action') as string || ''
	const selector = url.searchParams.get('selector') || 'this'
	// const { action, item, selector } = req.query
	let resdata
	let res

	if (action === 'dockerps') {
		resdata = mangeData(action as string, selector as string)
	} else {
		resdata = mangeData('index', selector as string)
	}
	res = new Response(JSON.stringify(resdata))
	res.headers.set('Content-Type', 'application/json')
	return res
})

router.get("/group-changed", (request, { url }) => {
	const __changed_value = url.searchParams.get('__changed_value') as string || ''
	const want = url.searchParams.get('want') as WantType || 'raw'

	let resdata
	let res

	switch (want) {
		case 'map':
			resdata = { data: { __changed_value } }
			break
		case 'list':
			resdata = {
				data: demodata[__changed_value].map(it => {
					return { value: it }
				})
			}
			break
		default:
			resdata = "hello, it's text data."
			break
	}

	if (want === 'raw') {
		res = new Response(resdata + '')
		res.headers.set('Content-Type', 'text/plain')
	} else {
		res = new Response(JSON.stringify(resdata))
		res.headers.set('Content-Type', 'application/json')
	}
	return res
})

router.all('*', () => new Response(`
	<h1>Not Found.</h1>
	<p>Try <a href="/fixtures/todo">/fixtures/todo</a></p>
	<p>Try <a href="/fixtures/group-changed">/fixtures/group-changed</a></p>
`, { status: 404 }));

export default router;
