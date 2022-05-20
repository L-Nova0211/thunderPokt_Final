import { browser } from '$app/env';
import { PolygonNetworkVersion } from '$lib/constants';
import { ethers } from 'ethers';
import { writable } from 'svelte/store';

export let accounts = writable([]);

export let selectedChain = writable(null);

export let selectedProvider = writable(null);

export let requestAccounts = async () => {
	if (window.ethereum === undefined)
		throw new Error('Please install an Ethereum Wallet such as Metamask');

	// A Web3Provider wraps a standard Web3 provider, which is
	// what MetaMask injects as window.ethereum into each page
	const provider = new ethers.providers.Web3Provider(window.ethereum);

	// MetaMask requires requesting permission to connect users accounts
	accounts.set(await provider.send('eth_requestAccounts', []));

	selectedChain.set(window.ethereum.chainId);

	selectedProvider.set(provider);
};

export let addPolygonNetwork = async () => {
	let networkParams = {
		chainId: PolygonNetworkVersion, // A 0x-prefixed hexadecimal string
		chainName: 'Polygon Mainnet',
		nativeCurrency: {
			// name: string,
			symbol: 'MATIC', // 2-6 characters long
			decimals: 18
		},
		rpcUrls: ['https://polygon-rpc.com/'],
		blockExplorerUrls: ['https://polygonscan.com/']
		// iconUrls?: string[], // Currently ignored.
	};

	await window.ethereum.request({
		method: 'wallet_addEthereumChain',
		params: [networkParams]
	});
};
