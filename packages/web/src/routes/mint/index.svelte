<script context="module">
	export async function load({ params, fetch, session, stuff }) {
		const url = `/mint.json`;
		const response = await fetch(url);
		const { pokt_price, tpokt_price, pokt_price_error, tpokt_price_error } =
			response.ok && (await response.json());
		console.log('load new data', { pokt_price, tpokt_price, pokt_price_error, tpokt_price_error });
		return { props: { pokt_price, tpokt_price, pokt_price_error, tpokt_price_error } };
	}
</script>

<script lang="ts">
	import { fade } from 'svelte/transition';
	import { browser } from '$app/env';
	import Errors from '$lib/components/Errors.svelte';
	import {
		CoinGeckoPOKTUrl,
		PolygonNetworkVersion,
		SushiUrl,
		ThunderPOKTWalletAddress
	} from '$lib/constants';
	import { accounts, requestAccounts, selectedChain, addPolygonNetwork } from '$lib/stores/dapp';
	import CopyableTextArea from '$lib/components/CopyableTextArea.svelte';

	let mint_pokt_amount;
	let mint_fee_amount = 0.01;
	let promise = null;

	let curr_page = 1;
	export let pokt_price;
	export let tpokt_price;
	export let pokt_price_error;
	export let tpokt_price_error;

	console.log('rendering', { pokt_price, tpokt_price, pokt_price_error, tpokt_price_error });
</script>

<svelte:head>
	<title>ThunderPOKT | Mint</title>
</svelte:head>

{#await promise}
	<!-- purposefully empty -->
{:catch error}
	<Errors onButtonClickHandler={() => (promise = null)}>
		{@debug error}
		<div slot="modal-body">
			<p>Error: {error.message}</p>

			<div class="mt-5 bg-gray-700 text-white text-xs w-full overflow-auto p-2">
				<h3 class="font-mono">// For the devs 👩🏻‍💻 JSON.stringify(error, null, 2)</h3>
				<pre class="max-w-full">{JSON.stringify(error, null, 2)}</pre>
			</div>
		</div>
	</Errors>
{/await}

<main class="container m-auto mb-0 flex-grow flex flex-col items-center justify-center">
	<div class="page">
		<div class="border-b-2  mb-10 pb-4"><h1 class="text-xl text-center">MINT tPOKT</h1></div>

		{#if curr_page == 1}
			<!-- Step 1. Wallet and Mint Amount -->
			<div>
				{#if $accounts.length === 0}
					<div>
						<h3 class="text-2xl text-center mb-10">No Wallet Connected</h3>

						<p class="mb-5">Please connect a wallet to mint.</p>
						<button
							on:click={() => (promise = requestAccounts())}
							class="btn-primary"
							type="button"
							name="button"
						>
							<strong>Connect Wallet</strong>
						</button>
					</div>
				{:else if $selectedChain == PolygonNetworkVersion}
					<div><h3 class="text-2xl text-center mb-10">Enter tPOKT Amount to Mint</h3></div>

					<div class="group">
						<div class="relative">
							<label for="mintPoktAmount">
								<span class="sr-only">Amount of POKT to Mint</span>
								<div
									class="mt-1 flex w-full items-center rounded-md bg-white  border-2 border-gray-300 shadow-sm focus:border-sky-300 focus:ring focus:ring-sky-200 focus:ring-opacity-50 h-16 text-xl"
								>
									<img
										class="inline-flex p-2 h-8 md:h-12 rounded-l-md"
										src="/img/tpokt.png"
										alt="tPOKT"
									/>
									<input
										type="number"
										id="mintPoktAmount"
										class="inline-flex flex-grow h-8 md:h-12 md:text-xl p-2 text-right max-w-full rounded-md border-0"
										placeholder="0.0"
										min="0"
										name="mintPoktAmount"
										bind:value={mint_pokt_amount}
									/>
								</div>
							</label>
						</div>
					</div>

					<div class="border-t border-gray-200">
						<dl>
							<div class="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
								<dt class="text-sm font-medium text-gray-500">Minting to:</dt>
								<dd
									title={$accounts[0]}
									class="mt-1 text-lg text-gray-900 sm:mt-0 sm:col-span-2 sm:text-right"
								>
									{$accounts[0].slice(0, 6)}...{$accounts[0].slice(
										$accounts[0].length - 4,
										$accounts[0]
									)}
								</dd>
							</div>
							<div class="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
								<dt class="text-sm font-medium text-gray-500">Mint Fee:</dt>
								<dd class="mt-1 text-lg text-gray-900 sm:mt-0 sm:col-span-2 sm:text-right">
									{mint_fee_amount} POKT
								</dd>
							</div>
							<div class="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
								<dt class="text-sm font-medium text-gray-500">You will receive:</dt>
								<dd class="mt-1 text-lg text-gray-900 sm:mt-0 sm:col-span-2 sm:text-right">
									{#if mint_pokt_amount}{mint_pokt_amount - mint_fee_amount} tPOKT{/if}
								</dd>
							</div>

							{#if pokt_price_error || tpokt_price_error}
								{console.log('encountered error fetching prices', {
									pokt_price_error,
									tpokt_price_error
								})}
							{:else if tpokt_price / pokt_price <= 0.95}
								<div class="bg-red-300 px-4 py-5 sm:px-6">
									<h4 class="text-sm font-medium text-gray-700 pb-4">
										<span class="text-lg block text-center">HEADS UP!</span> <br />
										It may be cheaper to buy tPOKT than to mint POKT due to the USD price difference
										on Sushiswap and the price listed on Coingecko.
									</h4>
									<div class="sm:grid sm:grid-cols-3 sm:gap-4 ">
										<dt class="text-sm font-medium text-gray-700 sm:col-span-2">
											<a href="/swap" target="_blank" class="underline">
												tPOKT-USD Price on Sushiswap</a
											>
										</dt>
										<dd class="mt-1 xl:text-lg text-gray-700 sm:mt-0 sm:text-right">
											<img
												class="inline p-2 h-10 rounded-l-md"
												src="/img/tpokt.png"
												alt="tPOKT"
											/>{tpokt_price}
										</dd>

										<dt class="text-sm font-medium text-gray-700 sm:col-span-2">
											<a href={CoinGeckoPOKTUrl} target="_blank" class="underline"
												>POKT-USD Price Listed on CoinGecko</a
											>
										</dt>
										<dd class="mt-1 xl:text-lg text-gray-700 sm:mt-0 sm:text-right">
											<img
												class="inline p-2 h-10 rounded-l-md"
												src="/img/pokt.svg"
												alt="POKT"
											/>{pokt_price}
										</dd>
									</div>
									<a href="/swap" target="_blank" class="btn-primary  mt-5">
										<strong>BUY MORE tPOKT</strong>
									</a>
								</div>
							{/if}
						</dl>
					</div>

					<button
						disabled={mint_pokt_amount <= 0}
						on:click={() => (curr_page = 2)}
						class="btn-secondary  mt-10"
					>
						<strong>Review</strong>
					</button>
				{/if}
			</div>
		{:else if curr_page == 2}
			<!-- Step 2. Review and Send POKT -->
			<div>
				<div><h3 class="text-2xl text-center mb-5">How to Mint</h3></div>

				<p>
					Please read <strong><i>carefully</i></strong> and follow all of the directions or your funds
					could be potentially lost.
				</p>
				<br />
				<p>
					Login into your <a
						class="underline text-sky-500"
						target="_blank"
						href="https://wallet.pokt.network">POKT wallet</a
					> and create a new transaction.
				</p>
				<br />

				<p><strong>Paste this in the memo:</strong></p>
				<CopyableTextArea text={`{"evmAddress":"${$accounts[0]}","chainId":137}`} />
				<br />

				<p>Please send <strong>{mint_pokt_amount}</strong> POKT to this address:</p>

				<CopyableTextArea text={ThunderPOKTWalletAddress} />

				<div class="mt-5">
					<button
						class="btn-primary"
						on:click={() => {
							curr_page = 3;
						}}
					>
						<strong>I HAVE SENT POKT</strong>
					</button>
				</div>
			</div>
		{:else if curr_page == 3}
			<div>
				<img src="/img/tpokt.png" alt="ThunderPOKT" class="mx-auto w-32 mb-10" />
				<div>
					<h3 class="text-2xl text-center mb-5">You should receive your tPOKT soon!</h3>
				</div>
				<p>
					If you have followed all instructions, you should receive your tPOKT in the next 10
					minutes to an hour
				</p>
				<br />
				<p>
					If you have sent an invalid memo the POKT will be sent back to your account in the next 2
					POKT blocks.
				</p>
				<br />

				<button
					class="btn-primary"
					on:click={() => {
						curr_page = 1;
					}}
				>
					<strong>MINT MORE</strong>
				</button>
			</div>
		{/if}

		<div class="flex justify-center mt-10">
			<nav class="pagination" aria-label="Pagination">
				<!-- Current: "", Default: "bg-white border-gray-300 text-gray-500 hover:bg-gray-50" -->
				<button
					on:click={(e) => (curr_page = 1)}
					class:active={curr_page == 1}
					disabled={curr_page == 3}
					class="bg-white border-gray-300 text-gray-500 hover:bg-gray-50 relative inline-flex items-center px-8 py-4 border text-xl font-medium disabled:pointer-events-none disabled:hover:cursor-not-allowed"
				>
					1
				</button>
				<button
					on:click={(e) => (curr_page = 2)}
					class:active={curr_page == 2}
					disabled={!$accounts[0] || !mint_pokt_amount || mint_pokt_amount <= 0}
					class="bg-white border-gray-300 text-gray-500 hover:bg-gray-50 relative inline-flex items-center px-8 py-4 border text-xl font-medium disabled:pointer-events-none disabled:hover:cursor-not-allowed"
				>
					2
				</button>
				<button
					on:click={(e) => (curr_page = 3)}
					class:active={curr_page == 3}
					disabled={curr_page != 3}
					class="bg-white border-gray-300 text-gray-500 hover:bg-gray-50 inline-flex relative items-center px-8 py-4 border text-xl font-medium disabled:pointer-events-none disabled:hover:cursor-not-allowed"
				>
					3
				</button>
			</nav>
		</div>
	</div>
</main>

<style>
	.page {
		@apply bg-slate-100 rounded-lg p-10 lg:w-1/2 w-full;
	}

	nav .active {
		@apply z-10 bg-sky-50 border-sky-500 text-sky-600;
	}
</style>
