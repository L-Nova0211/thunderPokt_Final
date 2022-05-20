<script lang="ts">
	import '../app.css';
	import Navbar from '$lib/components/Navbar.svelte';
	import Footer from '$lib/components/Footer.svelte';
	import { browser } from '$app/env';
	import { ethers } from 'ethers';
	import { accounts, selectedChain, selectedProvider } from '$lib/stores/dapp';
	import ErrorWrongChainModal from '$lib/components/ErrorWrongChainModal.svelte';
	import { page } from '$app/stores';
	import ErrorModal from '$lib/components/ErrorModal.svelte';
	import { errors } from '$lib/stores/errors';

	if (browser && window.ethereum) {
		window.ethers = ethers;
		window.ethereum.on('connect', (connectInfo) => {
			console.debug('connectInfo', connectInfo);
			const provider = new ethers.providers.Web3Provider(window.ethereum);
			selectedProvider.set(provider);
		});
		window.ethereum.on('chainChanged', (networkVersion) => {
			console.debug('networkVersion', networkVersion);
			selectedChain.set(window.ethereum.chainId);
			const provider = new ethers.providers.Web3Provider(window.ethereum);
			selectedProvider.set(provider);
		});
		window.ethereum.on('accountsChanged', (accountsChanged) => {
			console.debug('accountsChanged', accountsChanged);
			accounts.set(accountsChanged);
			const provider = new ethers.providers.Web3Provider(window.ethereum);
			selectedProvider.set(provider);
		});
	}

	let error = null;

	errors.subscribe((_errors) => (error = _errors[0]));
</script>

<div class="bg min-h-screen flex flex-col justify-between">
	<Navbar />

	{#if $page?.url?.pathname !== '/'}
		<ErrorWrongChainModal />
	{/if}

	<ErrorModal promise={null} {error} />

	<slot />

	<div class="">
		<Footer />
	</div>
</div>

<style>
	.bg {
		background-image: linear-gradient(85deg, #fbab7e 0%, #f7ce68 100%);
	}
</style>
