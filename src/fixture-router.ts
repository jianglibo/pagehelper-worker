import { Router } from 'itty-router';
import { WantType } from '.';

// now let's create a router (note the lack of "new")
const router = Router();

const demodata = {
	a: [1, 2, 3],
	b: [4, 5, 6],
	c: [7, 8, 9]
} as Record<string, number[]>

router.get("/group-changed", async (request, { url }) => {
	const __changed_value = url.searchParams.get('__changed_value') as string
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

export default router;
