<script lang="ts">
	import { browser } from '$app/env';
	import { addThunderPoktToWallet, tpoktContract } from '$lib/contracts/tpokt';
	import {
		PolygonNetworkVersion,
		ThunderPOKTPolygonMainnetAddress,
		ThunderPOKTPolygonMainnetDecimals,
		WrappedThunderPOKTPolygonMainnetDecimals
	} from '$lib/constants';
	import { accounts, requestAccounts, selectedChain, selectedProvider } from '$lib/stores/dapp';
	import { ethers } from 'ethers';
	import { addWrappedThunderPoktToWallet, wtpoktContract } from '$lib/contracts/wtpokt';
	import Loading from '$lib/components/Loading.svelte';
	import { page } from '$app/stores';
	import { tick } from 'svelte';

	let promise = null;
	let action = $page?.url?.searchParams.get('action') || 'wrap';
	let token_balance;
	let token_balance_promise;
	let tpokt_balance;
	let tpokt_balance_promise = [];
	let wtpokt_balance;
	let wtpokt_balance_promise = [];
	let token_amount_to_exchange;
	let input_token_amount_to_exchange;
	let token_amount_error = null;
	let tx_promise = null;
	let tx_status = null;
	let est_exchange_rate_promise = null;
	let est_to_amount_promise = null;
	let est_to_amount = null;
	let tpokt_allowance_to_wtpokt_promise = null;

	// ideally this would have been better to set as a store
	$: {
		console.log('handling input_token_amount_to_exchange');

		if (
			!input_token_amount_to_exchange ||
			input_token_amount_to_exchange <= 0 ||
			Number(input_token_amount_to_exchange) === NaN
		) {
			token_amount_to_exchange = input_token_amount_to_exchange = null;
		} else {
			token_amount_error = null;
			try {
				ethers.utils.parseUnits(
					input_token_amount_to_exchange.toString(),
					action === 'unwrap'
						? WrappedThunderPOKTPolygonMainnetDecimals
						: ThunderPOKTPolygonMainnetDecimals
				);

				if (token_balance && token_balance < Number(input_token_amount_to_exchange)) {
					token_amount_error = 'Cannot be greater than current balance.';
				} else {
					// token input is valid
					token_amount_to_exchange = input_token_amount_to_exchange;
				}
			} catch (e) {
				token_amount_error = e.message;
			}

			updateRates();
		}
	}

	async function refreshBalances() {
		console.log('refreshBalances');
		if (!$accounts[0]) return;

		const tpokt = tpoktContract();
		const wtpokt = wtpoktContract();

		tpokt_balance_promise = tpokt.balanceOf($accounts[0]).then(async (bal) => {
			tpokt_balance = ethers.utils.formatUnits(bal, ThunderPOKTPolygonMainnetDecimals);
			const converted_bal = ethers.utils.formatUnits(
				await wtpokt.getWtPOKTByTPOKT(bal),
				WrappedThunderPOKTPolygonMainnetDecimals
			);
			return [tpokt_balance, converted_bal];
		});

		wtpokt_balance_promise = wtpokt.balanceOf($accounts[0]).then(async (bal) => {
			wtpokt_balance = ethers.utils.formatUnits(bal, WrappedThunderPOKTPolygonMainnetDecimals);
			const converted_bal = ethers.utils.formatUnits(
				await wtpokt.getTPOKTByWtPOKT(bal),
				ThunderPOKTPolygonMainnetDecimals
			);
			return [wtpokt_balance, converted_bal];
		});

		if (action === 'unwrap') {
			token_balance_promise = wtpokt_balance_promise.then(([bal, converted_bal]) => {
				token_balance = bal;
				return [bal, converted_bal];
			});
		} else {
			token_balance_promise = tpokt_balance_promise.then(([bal, converted_bal]) => {
				token_balance = bal;
				return [bal, converted_bal];
			});
		}

		return Promise.all([tpokt_balance_promise, wtpokt_balance_promise, token_balance_promise]);
	}

	async function updateRates() {
		if (!$selectedProvider) { return; }
		console.log('updateRates');
		token_amount_to_exchange = Number(token_amount_to_exchange);
		if (
			!token_amount_to_exchange ||
			token_amount_to_exchange <= 0 ||
			Number(token_amount_to_exchange) === NaN
		) {
			token_amount_to_exchange = 0;
		}

		const token_amount = ethers.utils.parseUnits(
			token_amount_to_exchange.toString(),
			action === 'unwrap'
				? WrappedThunderPOKTPolygonMainnetDecimals
				: ThunderPOKTPolygonMainnetDecimals
		);

		console.log('token_amount', token_amount.toString());

		const tpokt = tpoktContract().connect($selectedProvider.getSigner());
		const wtpokt = wtpoktContract().connect($selectedProvider.getSigner());

		est_to_amount_promise = (
			action === 'unwrap'
				? wtpokt
						.getTPOKTByWtPOKT(token_amount)
						.then((amt) => ethers.utils.formatUnits(amt, ThunderPOKTPolygonMainnetDecimals))
				: wtpokt
						.getWtPOKTByTPOKT(token_amount)
						.then((amt) => ethers.utils.formatUnits(amt, WrappedThunderPOKTPolygonMainnetDecimals))
		).then((amt) => {
			est_to_amount = amt;
			console.log('est_to_amount', est_to_amount);
			return est_to_amount;
		});

		tpokt_allowance_to_wtpokt_promise =
			action === 'unwrap' ? null : tpokt.allowance($accounts[0], wtpokt.address);

		return Promise.all([
			updateExchangeRates(),
			est_to_amount_promise,
			tpokt_allowance_to_wtpokt_promise
		]);
	}

	async function submitWrapTx() {
		console.log('submitWrapTx');

		if (!token_amount_to_exchange) {
			return;
		}
		const wrapping_tpokt_amount = ethers.utils.parseUnits(
			token_amount_to_exchange.toString(),
			ThunderPOKTPolygonMainnetDecimals
		);
		console.log('wrapping tpokt amount', wrapping_tpokt_amount.toString());
		const tpokt = tpoktContract().connect($selectedProvider.getSigner());
		const wtpokt = wtpoktContract().connect($selectedProvider.getSigner());
		return tpokt.allowance($accounts[0], wtpokt.address).then((approved_amount) => {
			if (approved_amount.lt(wrapping_tpokt_amount)) {
				tx_status = 'SUBMITTING APPROVAL TX';
				return tpokt.approve(wtpokt.address, wrapping_tpokt_amount).then((tx) => {
					console.log('APPROVAL tx', tx);
					tx_status = 'WAITING FOR CONFIRMATION';
					return tx.wait();
				});
			} else {
				tx_status = 'SUBMITTING WRAP TX';
				return wtpokt
					.wrap(wrapping_tpokt_amount)
					.then((tx) => {
						tx_status = 'WAITING FOR CONFIRMATION';
						console.log('WRAP tx', tx);
						return tx.wait();
					})
					.then(() => {
						console.log('tx promise sent!');
						token_amount_to_exchange = input_token_amount_to_exchange = null;
					});
			}
		});
	}

	function submitUnwrapTx() {
		console.log('submitUnwrapTx');

		if (!token_amount_to_exchange) {
			return;
		}
		const unwrapping_wtpokt_amount = ethers.utils.parseUnits(
			token_amount_to_exchange.toString(),
			WrappedThunderPOKTPolygonMainnetDecimals
		);
		console.log('wrapping tpokt amount', unwrapping_wtpokt_amount.toString());
		const tpokt = tpoktContract().connect($selectedProvider.getSigner());
		const wtpokt = wtpoktContract().connect($selectedProvider.getSigner());
		tx_status = 'SUBMITTING UNWRAP TX';
		return wtpokt
			.unwrap(unwrapping_wtpokt_amount)
			.then((tx) => {
				tx_status = 'WAITING FOR CONFIRMATION';
				console.log('UNWRAP tx', tx);
				return tx.wait();
			})
			.then(() => {
				console.log('tx promise sent!');
				token_amount_to_exchange = input_token_amount_to_exchange = null;
			});
	}

	function submitTx() {
		console.log('submitTx');

		if (!token_amount_to_exchange) {
			return;
		}
		return (tx_promise = promise =
			(action === 'unwrap' ? submitUnwrapTx() : submitWrapTx())
				.then(() => {
					return Promise.all([refreshBalances(), updateRates()]);
				})
				.finally(() => {
					tx_promise = null;
					console.log('submitTx finally done');
				}));
	}

	function updateExchangeRates() {
		console.log('updateExchangeRates');
		const wtpokt = wtpoktContract();
		est_exchange_rate_promise =
			action === 'unwrap'
				? wtpokt
						.getTPOKTByWtPOKT(
							ethers.utils.parseUnits('1', WrappedThunderPOKTPolygonMainnetDecimals)
						)
						.then((amt) => ethers.utils.formatUnits(amt, ThunderPOKTPolygonMainnetDecimals))
				: wtpokt
						.getWtPOKTByTPOKT(ethers.utils.parseUnits('1', ThunderPOKTPolygonMainnetDecimals))
						.then((amt) => ethers.utils.formatUnits(amt, WrappedThunderPOKTPolygonMainnetDecimals));
	}

	async function setup() {
		input_token_amount_to_exchange = null;
		refreshBalances();
		if (!$selectedProvider || !$accounts[0]) {
			updateExchangeRates();
		} else {
			updateRates();
		}
	}

	if (browser) {
		page.subscribe(async (_page) => {
			if (_page && _page.url && _page.url.searchParams) {
				action = _page.url.searchParams.get('action');
			}
			setup();
		});
		accounts.subscribe(setup);
	}
</script>

<svelte:head>
	<title>ThunderPOKT | Wrap</title>
</svelte:head>

<main class="container m-auto mb-0 flex-grow flex flex-col items-center justify-center">
	<div class="page">
		<div class="border-b-2  mb-5 pb-4">
			<h1 class="text-xl text-center">
				Wrap & Unwrap tPOKT <br />
				<p class="text-gray-500 text-sm">Stable-balance tPOKT wrapper for DeFi</p>
			</h1>

			<div class="my-4 w-72 mx-auto">
				<nav class="rounded-full bg-slate-500 flex justify-between text-center items-center">
					<a class:active={action === 'wrap' || action !== 'unwrap'} href="/wrap">Wrap</a>
					<a class:active={action === 'unwrap'} href="/wrap?action=unwrap">Unwrap</a>
				</nav>
			</div>
		</div>

		{#if $accounts[0]}
			<dl class="border-b-2">
				<h3 class="text-gray-500 text-center">Wallet Balance Summary</h3>
				<div class="sm:grid sm:grid-cols-2">
					<div class="px-4 pt-2.5 pb-5 sm:px-6 sm:col-span-2">
						<dt class="text-sm font-medium text-gray-500">Connected as:</dt>
						<dd title={$accounts[0]} class="text-lg text-gray-900">
							{$accounts[0].slice(0, 6)}...{$accounts[0].slice(
								$accounts[0].length - 4,
								$accounts[0]
							)}
						</dd>
					</div>
					<div class="px-4 py-5 sm:px-6">
						<dt class="text-sm font-medium text-gray-500">
							tPOKT Balance: <a
								class="inline"
								href="#_"
								on:click|preventDefault={addThunderPoktToWallet}
								><svg
									xmlns="http://www.w3.org/2000/svg"
									class="inline h-4 w-4 mb-1"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
									stroke-width="2"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z"
									/>
								</svg></a
							>
						</dt>
						<dd class="mt-1 text-lg text-gray-900">
							{#await tpokt_balance_promise}
								<Loading />
							{:then [balance, converted_bal]}
								{balance} tPOKT <br />
								<span class="text-xs text-gray-500">≈ {converted_bal} wtPOKT</span>
							{/await}
						</dd>
					</div>
					<div class="px-4 py-5 sm:px-6">
						<dt class="text-sm font-medium text-gray-500">
							wtPOKT Balance: <a
								class="inline"
								href="#_"
								on:click|preventDefault={addWrappedThunderPoktToWallet}
								><svg
									xmlns="http://www.w3.org/2000/svg"
									class="inline h-4 w-4 mb-1"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
									stroke-width="2"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z"
									/>
								</svg></a
							>
						</dt>
						<dd class="mt-1 text-lg text-gray-900">
							{#await wtpokt_balance_promise}
								<Loading />
							{:then [wtpokt_balance, converted_bal]}
								{wtpokt_balance} wtPOKT <br />
								<span class="text-xs text-gray-500">≈ {converted_bal} tPOKT</span>
							{/await}
						</dd>
					</div>
				</div>
			</dl>
		{/if}

		<div class="p-4 ">
			<div>
				<!-- Check Wallets -->
				{#if $accounts.length === 0}
					<div class="text-center">
						<h3 class="text-center mb-5">No Wallet Connected</h3>

						<p class="mb-5">Please connect a wallet to wrap.</p>
						<button
							on:click={() => (promise = requestAccounts()).then(() => (promise = null))}
							class="btn-primary"
							type="button"
							name="button"
						>
							<strong>Connect Wallet</strong>
						</button>
					</div>
				{:else if $selectedChain == PolygonNetworkVersion}
					<!-- default to wrap -->
					<h2 class="text-lg mb-5 text-center">
						{#if action == 'unwrap'}
							Unwrapping wtPOKT for tPOKT
						{:else}
							Wrapping tPOKT for wtPOKT
						{/if}
					</h2>

					<div class="group">
						<div class="relative">
							<label for="tokenAmountToExchange">
								<span class="text-slate-400">
									{#if action == 'unwrap'}
										Amount of wtPOKT to Unwrap
									{:else}
										Amount of tPOKT to Wrap
									{/if}
									<br />
									{#if token_amount_error}
										<span class="text-red-500">
											{token_amount_error}
										</span>
									{/if}
								</span>

								<div
									class="mt-1 flex w-full items-center rounded-md bg-white  border-2 border-gray-300 shadow-sm focus:border-sky-300 focus:ring focus:ring-sky-200 focus:ring-opacity-50 h-16 text-xl"
								>
									<img
										class="inline-flex p-2 h-8 md:h-12 rounded-l-md"
										src="/img/tpokt.png"
										alt="tPOKT"
									/>
									<input
										title={action === 'unwrap'
											? 'Amount of wtPOKT to Unwrap'
											: 'Amount of tPOKT to Wrap'}
										type="number"
										id="tokenAmountToExchange"
										class="inline-flex flex-grow h-8 md:h-12 md:text-xl p-2 text-right max-w-full rounded-md border-0"
										placeholder="0.0"
										min="0"
										max={token_balance ? Number(token_balance).toString() : ''}
										name="tokenAmountToExchange"
										disabled={Number(token_balance) === 0}
										class:hover:cursor-not-allowed={Number(token_balance) === 0}
										bind:value={input_token_amount_to_exchange}
									/>
								</div>
							</label>
						</div>
						<div class="flex justify-end ">
							{#await token_balance_promise then [bal, _]}
								<span class="inline-flex text-slate-400 items-center mr-2">
									{#if action === 'unwrap'}
										<span>Your wtPOKT Balance: {bal}</span>
									{:else}
										<span>Your tPOKT Balance: {bal}</span>
									{/if}
								</span>
								<button
									class="inline-flex py-2 px-4 bg-slate-300"
									on:click|preventDefault={() => {
										input_token_amount_to_exchange = bal;
									}}
								>
									MAX
								</button>
							{:catch error}
								<span class="text-red-500">
									{#if action === 'unwrap'}
										Failed fetching wtPOKT balance:
									{:else}
										Failed fetching tPOKT balance:
									{/if}
								</span>
								<span class="text-red-500">Error: {error.message}.</span>
								<button class="py-2 px-4 bg-slate-400" on:click={() => refreshBalances()}>
									Retry?
								</button>
							{/await}
						</div>
					</div>

					<!-- exchange rate summary -->
					<div class="mt-5">
						<dl>
							<!-- <div class="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
								<dt class="text-sm font-medium text-gray-500">Gas Fee:</dt>
								<dd class="mt-1 text-lg text-gray-900 sm:mt-0 sm:col-span-2 sm:text-right">
									{#if est_gas_amount_promise}
										{#await est_gas_amount_promise}
											<Loading />
										{:then est_gas_amount}
											{est_gas_amount} ETH
										{:catch e}
											<span class="text-red-500">Failed estimating gas. {e.message}</span>
										{/await}
									{/if}
								</dd>
							</div> -->
							<div class="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
								<dt class="text-sm font-medium text-gray-500">Exchange Rate:</dt>
								<dd class="mt-1 text-lg text-gray-900 sm:mt-0 sm:col-span-2 sm:text-right">
									{#if est_exchange_rate_promise}
										{#await est_exchange_rate_promise}
											<Loading />
										{:then amount}
											{#if action === 'unwrap'}
												1 wtPOKT = {amount} tPOKT
											{:else}
												1 tPOKT = {amount} wtPOKT
											{/if}
										{:catch e}
											<span class="text-red-500">Failed fetching exchange rate. {e.message}</span>
										{/await}
									{/if}
								</dd>
							</div>
							{#if action !== 'unwrap'}
								<div class="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
									<dt class="text-sm font-medium text-gray-500">Allowance:</dt>
									<dd class="mt-1 text-lg text-gray-900 sm:mt-0 sm:col-span-2 sm:text-right">
										{#if tpokt_allowance_to_wtpokt_promise}
											{#await tpokt_allowance_to_wtpokt_promise}
												<Loading />
											{:then allowance}
												{ethers.utils.formatUnits(allowance, ThunderPOKTPolygonMainnetDecimals)} tPOKT
											{:catch e}
												<span class="text-red-500">Failed fetching allowance. {e.message}</span>
											{/await}
										{/if}
									</dd>
								</div>
							{/if}
							<div class="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
								<dt class="text-sm font-medium text-gray-500">Receiving:</dt>
								<dd class="mt-1 text-lg text-gray-900 sm:mt-0 sm:col-span-2 sm:text-right">
									{#if est_to_amount_promise}
										{#if action === 'unwrap'}
											{#await est_to_amount_promise}
												<Loading />
											{:then amount}
												{amount} tPOKT
											{:catch e}
												<span class="text-red-500"
													>Failed estimating receving amount. {e.message}</span
												>
											{/await}
										{:else}
											{#await est_to_amount_promise}
												<Loading />
											{:then amount}
												{amount} wtPOKT
											{:catch e}
												<span class="text-red-500"
													>Failed estimating receving amount. {e.message}</span
												>
											{/await}
										{/if}
									{/if}
								</dd>
							</div>
						</dl>
					</div>

					<div class="mt-5">
						{#await token_balance_promise then [bal, _]}
							{#if bal == 0}
								{#if action === 'unwrap'}
									<h3 class="text-center  text-lg mt-5">Your wtPOKT balance is empty.</h3>
									<a href="/wrap" class="btn-primary  mt-5">
										<strong>WRAP MORE tPOKT</strong>
									</a>
								{:else}
									<h3 class="text-center text-lg mt-5">Your tPOKT balance is empty.</h3>
									<a href="/swap" target="_blank" class="btn-primary  mt-5">
										<strong>BUY MORE tPOKT</strong>
									</a>
								{/if}
							{:else}
								<!-- has tpokt balance to wrap -->
								{#if promise}
									{#await promise}
										<!-- purposefully empty -->
									{:catch error}
										<div class="text-red-500">
											<h4>Something went wrong!</h4>
											<p>
												Error: {error.message}
											</p>
										</div>
									{/await}
								{/if}
								<button
									disabled={(action === 'unwrap' && wtpokt_balance === 0) ||
										(action !== 'unwrap' && tpokt_balance === 0) ||
										!token_amount_to_exchange ||
										token_amount_to_exchange <= 0 ||
										tx_promise}
									on:click|preventDefault={submitTx}
									class="btn-secondary  mt-5"
								>
									{#if action === 'unwrap'}
										{#if tx_promise}
											<strong
												><Loading />
												{#if tx_status}{tx_status}{:else}CONFIRMING UNWRAP TRANSACTION{/if}</strong
											>
										{:else}
											<strong>SUBMIT UNWRAP TRANSACTION</strong>
										{/if}
									{:else if tpokt_allowance_to_wtpokt_promise}
										{#await tpokt_allowance_to_wtpokt_promise}
											<Loading />
										{:then allowance}
											{#if tx_promise}
												<strong
													><Loading />
													{#if tx_status}{tx_status}{:else}CONFIRMING WRAP TRANSACTION{/if}</strong
												>
											{:else if allowance.lt(ethers.utils.parseUnits(Number(token_amount_to_exchange).toString(), ThunderPOKTPolygonMainnetDecimals))}
												<strong>SUBMIT APPROVAL TRANSACTION</strong>
											{:else}
												<strong>SUBMIT WRAP TRANSACTION</strong>
											{/if}
										{:catch e}
											<span>Failed determining allowance: {e.message}</span>
										{/await}
									{:else}
										<strong>SUBMIT WRAP TRANSACTION</strong>
									{/if}
								</button>
							{/if}
						{/await}
					</div>
				{/if}
			</div>
		</div>
	</div>
</main>

<style>
	nav a {
		@apply rounded-full block w-full h-full p-4 text-white;
	}
	nav .active {
		@apply bg-slate-100 text-inherit border-2 border-slate-500;
	}
</style>
