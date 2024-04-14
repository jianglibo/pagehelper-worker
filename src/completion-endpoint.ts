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
			label: 'ph-parameters',
			detail: 'set the parameters of the request.',
		}
		],
		snippets: []
	}
}

router.get("/ph", async (request, { url, env }: { url: URL, env: Env }) => {
	return Response.json(c)
})

export default router;
