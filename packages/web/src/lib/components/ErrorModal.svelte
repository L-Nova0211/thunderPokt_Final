<script>
	import Errors from './Errors.svelte';

	export let promise = null;
	export let error = null;

	if (promise) {
		promise.catch((e) => {
			console.error(e)((error = e.reason));
		});
	}
</script>

{#if error}
	{@debug error}
	<Errors
		onButtonClickHandler={() => {
			promise = null;
			error = null;
		}}
	>
		<div slot="modal-body" class="max-w-full">
			<p>Error: {error.message}</p>

			<div class="mt-5 bg-gray-700 text-white text-xs max-w-full overflow-auto p-2">
				<h3 class="font-mono">// For the devs 👩🏻‍💻 JSON.stringify(error, null, 2)</h3>
				<pre class="">{JSON.stringify(error, null, 2)}</pre>
			</div>
		</div>
	</Errors>
{/if}
