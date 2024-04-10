import { Router, error, json, withParams } from 'itty-router';
import { WantType } from '.';
import hljs from 'highlight.js';


const router = Router({
	base: '/highlight',
	// before: [withParams],
	// catch: error,
	// finally: [json],
})


router.get("/", async ({ req: Request, params, query }) => {
	const { content, lang, css, version } = query
	// console.log('content', content, lang, css, version)
	if (css) {
		const version1 = version || '11.9.0'
		const url = `https://cdnjs.cloudflare.com/ajax/libs/highlight.js/${version1}/styles/default.min.css`
		// fetch the content and return to client
		const cssContent = await fetch(url)
			.then(response => response.text())
		// console.log('cssContent', cssContent)
		return new Response(cssContent, {
			headers: {
				'Content-Type': 'text/plain'
			}
		});
	} else {
		const highlightedCode = hljs.highlight(
			content + '',
			{ language: lang + '' }
		).value
		return new Response(highlightedCode, {
			headers: {
				'Content-Type': 'text/plain'
			}
		});
	}
})



export default router;
