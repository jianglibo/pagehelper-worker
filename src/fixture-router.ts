import { Router, error, json, withParams } from 'itty-router';
import { WantType } from '.';

// now let's create a router (note the lack of "new")
// const router = Router();

const router = Router({
	base: '/fixtures',
	// before: [withParams],
	// catch: error,
	// finally: [json],
})

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

router.delete("/todo", (request, { url }) => {
	return idResponse(request, url)
})

router.get("/todo", (request, { url }) => {
	return idResponse(request, url)
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
