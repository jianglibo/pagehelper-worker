import { Router } from 'itty-router';
import { PerClientResponse } from './completion';

const router = Router({
	base: '/completions',
})


const c: PerClientResponse = {
	data: {
		completions: [{
			label: 'ph-link',
			detail: 'convert an element to a link, append parameters needed.',
		},
		{
			label: 'ph-pjax-link',
			detail: 'convert an element to a pjax link, append parameters needed.',
		},
		{
			label: 'ph-ajax',
			detail: 'send an ajax request.',
		},
		{
			label: 'ph-form',
			detail: 'send a form request.',
		},
		{
			label: 'ph-highlight',
			detail: 'highlight the code.',
		},
		{
			label: 'ph-page-submitter',
			detail: 'submit the page.',
		},
		{
			label: 'ph-ajax-upload',
			detail: 'upload a file via ajax.',
		},
		{
			label: 'ph-row-selector',
			detail: 'select a row.',
		},
		{
			label: 'ph-row-selector-all',
			detail: 'select all rows.',
		},
		{
			label: 'ph-selector-listener',
			detail: 'listen to a selector.',
		},
		{
			label: 'ph-target',
			detail: 'set the targets of the server response.',
		},
		{
			label: 'ph-data-consumer',
			detail: 'consume the data from the server response.',
		},
		{
			label: 'ph-data-consumer="innerhtml-mustache"',
			detail: 'using mustache template',
		},
		{
			label: 'ph-data-consumer="alpine"',
			detail: 'set data field of the target',
		},
		{
			label: 'ph-data-consumer="value"',
			detail: 'set the value of the target',
		},
		{
			label: 'ph-params',
			detail: 'set the parameters of the request.',
		},
		{ label: 'x-data', detail: 'provide data context to the element.' },
		{ label: 'x-init', detail: 'initialize the element. await is ok.' },
		{ label: 'x-show', detail: 'conditionally show the element.' },
		{ label: 'x-bind', detail: 'connect the attributes, classes, styles to the data.' },
		{ label: 'x-on', detail: 'listen to an event. avoid cameCase.' },
		{ label: 'x-text', detail: 'set the textContent of the element.' },
		{ label: 'x-html', detail: 'set the innerHTML of the element.' },
		{ label: 'x-model', detail: 'bind VALUE of element to data' },
		{ label: 'x-modelable', detail: 'make changes two way.' },
		{ label: 'x-for', detail: '<template x-for="(color, index) in colors" x-bind:key="index">' },
		{ label: 'x-transition', detail: 'add transition to the element.' },
		{ label: 'x-effect', detail: 'detect the change of data and do something' },
		{ label: 'x-ignore', detail: 'out of concern of Alpine.' },
		{ label: 'x-ref', detail: 'reference the element.' },
		{ label: 'x-cloak', detail: 'hide the element until alpine is ready.' },
		{ label: 'x-teleport', detail: 'teleport the element to somewhere else.' },
		{ label: 'x-if', detail: 'conditionally render the element.' },
		{ label: 'x-id', detail: 'given a new scope of ids.' },
		{ label: '$el', detail: 'the element itself.' },
		{ label: '$refs', detail: 'the references of the element.' },
		{ label: '$store', detail: 'the global state store' },
		{ label: '$watch', detail: 'watch the data changes.' },
		{ label: '$dispatch', detail: 'dispatch an event.' },
		{ label: '$nextTick', detail: 'run the callback after the next tick.' },
		{ label: '$root', detail: 'the closest element up the DOM tree that contains x-data' },
		{ label: '$data', detail: 'the data of the element.' },
		{ label: '$id', detail: 'get scoped id. x-bind:id="$id(\'text-input\')"' }

		],
		snippets: []
	}
}

router.get("/ph", async (request, { url, env }: { url: URL, env: Env }) => {
	return Response.json(c)
})

export default router;
