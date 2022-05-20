<script lang="ts">
	export let text: string;
	let textarea;
	let promise = null;

	function copyText() {
		textarea.select();
		textarea.setSelectionRange(0, 99999); /* For mobile devices */
		try {
			navigator.clipboard.writeText(text);
		} catch (e) {
			console.error('Failed writing clipboard', e);
			alert('Failed copying text. Please manually copy.');
		}
	}
</script>

<div class="flex justify-center items-center bg-slate-200  border-2 border-slate-300">
	<textarea
		bind:this={textarea}
		class="bg-slate-200 w-full p-4 font-mono border-0 resize-none"
		readonly={true}
		value={text}
	/>

	{#await promise}
		copying...
	{:then}
		<button class="p-2" on:click={copyText}>
			<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" focusable="false">
				<path
					d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"
				/>
			</svg>
		</button>
	{:catch error}
		something went wrong while copying that! {error}
	{/await}
</div>
