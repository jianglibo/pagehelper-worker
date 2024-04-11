import { Router, error, json, withParams } from 'itty-router';
import { WantType } from '.';
import hljs from 'highlight.js';
import juice from 'juice';

const hlcsses: { [key: string]: string } = {
	'11.9.0': '<style>pre code.hljs{display:block;overflow-x:auto;padding:1em}code.hljs{padding:3px 5px}.hljs{background:#f3f3f3;color:#444}.hljs-comment{color:#697070}.hljs-punctuation,.hljs-tag{color:#444a}.hljs-tag .hljs-attr,.hljs-tag .hljs-name{color:#444}.hljs-attribute,.hljs-doctag,.hljs-keyword,.hljs-meta .hljs-keyword,.hljs-name,.hljs-selector-tag{font-weight:700}.hljs-deletion,.hljs-number,.hljs-quote,.hljs-selector-class,.hljs-selector-id,.hljs-string,.hljs-template-tag,.hljs-type{color:#800}.hljs-section,.hljs-title{color:#800;font-weight:700}.hljs-link,.hljs-operator,.hljs-regexp,.hljs-selector-attr,.hljs-selector-pseudo,.hljs-symbol,.hljs-template-variable,.hljs-variable{color:#ab5656}.hljs-literal{color:#695}.hljs-addition,.hljs-built_in,.hljs-bullet,.hljs-code{color:#397300}.hljs-meta{color:#1f7199}.hljs-meta .hljs-string{color:#38a}.hljs-emphasis{font-style:italic}.hljs-strong{font-weight:700}</style>'
}

const router = Router({
	base: '/highlight',
	// before: [withParams],
	// catch: error,
	// finally: [json],
})


router.get("/", async ({ req: Request, params, query }) => {
	const { content, lang, css, version, inline } = query
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
		let highlightedCode = hljs.highlight(
			content + '',
			{ language: lang + '' }
		).value

		if (inline) {
			const version1 = (version || '11.9.0') + ''
			const cssContent = hlcsses[version1]
			highlightedCode = juice(cssContent + highlightedCode)
		}
		highlightedCode = `<pre><code class="hljs">${highlightedCode}</code></pre>`
		return new Response(highlightedCode, {
			headers: {
				'Content-Type': 'text/plain'
			}
		});
	}
})



export default router;
