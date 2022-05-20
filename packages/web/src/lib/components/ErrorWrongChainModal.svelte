<script>
	import ErrorModal from '$lib/components/ErrorModal.svelte';
	import Errors from '$lib/components/Errors.svelte';
	import { PolygonNetworkVersion } from '$lib/constants';

	import { selectedChain, addPolygonNetwork } from '$lib/stores/dapp';
	let promise = null;
</script>

<ErrorModal {promise} />

{#if $selectedChain && $selectedChain != PolygonNetworkVersion}
	<Errors>
		<div slot="modal-body">
			<div><h3 class="text-xl text-center mb-10">Connected to wrong chain.</h3></div>
			<p class="mb-5">Add Polygon Network or switch to Polygon network below.</p>
			<button
				class="btn-tertiary"
				on:click={async () => {
					await addPolygonNetwork();
					promise = null;
				}}><strong>ADD POLYGON NETWORK</strong></button
			>
		</div>
	</Errors>
{/if}
