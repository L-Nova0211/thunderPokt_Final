<script lang="ts">
	import { tpoktContract } from '$lib/contracts/tpokt';
	import { PolygonNetworkVersion } from '$lib/constants';
	import { accounts, requestAccounts, selectedChain, selectedProvider } from '$lib/stores/dapp';
	import CopyableTextArea from '$lib/components/CopyableTextArea.svelte';
	import { ethers } from 'ethers';
	import { validatePoktAddress } from '$lib/contracts/pokt';

	import ErrorModal from '$lib/components/ErrorModal.svelte';

	let tpokt_balance;
	let burn_pokt_amount;
	let pokt_address = '';
	let is_valid_pokt_address = true;
	let promise = null;
	let balance_promise = null;
	let is_valid_burn_amount = false;
	let curr_page = 1;
	let burn_tx_promise;
	let burn_receipt_promise;

	function validate_pokt_address() {
		is_valid_pokt_address = validatePoktAddress(pokt_address);
	}

	async function refreshBalances() {
		if (!$accounts[0]) return;

		balance_promise = tpoktContract()
			.balanceOf($accounts[0])
			.then(async (bal) => {
				tpokt_balance = ethers.utils.formatUnits(await bal, await tpoktContract().decimals());
				return tpokt_balance;
			});
	}

	accounts.subscribe(refreshBalances);

	function validateBurnAmount() {
		if (tpokt_balance < burn_pokt_amount || burn_pokt_amount === 0) {
			is_valid_burn_amount = false;
			return;
		}
		is_valid_burn_amount = true;
	}

	async function submitBurnTx() {
		validateBurnAmount();
		validate_pokt_address();

		if (!is_valid_burn_amount) {
			curr_page = 1;
			return;
		}
		if (!is_valid_pokt_address) {
			curr_page = 2;
			return;
		}

		let tpokt = tpoktContract().connect($selectedProvider.getSigner());
		let decimals = await tpokt.decimals();

		console.log(
			'burn amount',
			ethers.utils.parseUnits(burn_pokt_amount.toString(), decimals).toString()
		);
		console.log('pokt address', pokt_address);

		try {
			promise = burn_tx_promise = tpokt.burn(
				ethers.utils.parseUnits(burn_pokt_amount.toString(), decimals).toString(),
				pokt_address
			);

			console.log('Sent tx', await burn_tx_promise);

			curr_page = 5;

			promise = burn_receipt_promise = (await burn_tx_promise).wait();

			await promise;
		} finally {
			console.log('fainlly!');
			promise = null;
		}
	}
</script>

<svelte:head>
	<title>ThunderPOKT | Burn</title>
</svelte:head>

<ErrorModal {promise} />

<main class="container m-auto mb-0 flex-grow flex flex-col items-center justify-center">
	<div class="page">
		<div class="border-b-2  mb-10 pb-4"><h1 class="text-xl text-center">BURN tPOKT</h1></div>
		{#if curr_page == 1}
			<!-- Step 1. Wallet and Burn Amount -->
			<div>
				{#if $accounts.length === 0}
					<div>
						<h3 class="text-2xl text-center mb-10">No Wallet Connected</h3>

						<p class="mb-5">Please connect a wallet to burn.</p>
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
					<div><h3 class="text-2xl text-center mb-10">Enter tPOKT Amount to Burn</h3></div>
					<p>
						When you burn tPOKT, you will receive native POKT to your POKT address in 21-28 days.
					</p>
					<br />

					<p>During this time, you will not earn any rewards.</p>
					<br />

					<div class="group">
						<div class="relative">
							<label for="burnPoktAmount">
								<span class="sr-only">Amount of POKT to Burn</span>

								{#if !is_valid_burn_amount && tpokt_balance != 0 && burn_pokt_amount}
									<span class="text-red-500">Please enter a valid burn amount.</span>
								{/if}

								<div
									class:border-red-500={!is_valid_burn_amount &&
										tpokt_balance != 0 &&
										burn_pokt_amount}
									class="mt-1 flex w-full items-center rounded-md bg-white  border-2 border-gray-300 shadow-sm focus:border-sky-300 focus:ring focus:ring-sky-200 focus:ring-opacity-50 h-16 text-xl"
								>
									<img
										class="inline-flex p-2 h-8 md:h-12 rounded-l-md"
										src="/img/tpokt.png"
										alt="tPOKT"
									/>
									<input
										type="number"
										id="burnPoktAmount"
										class="inline-flex flex-grow h-8 md:h-12 md:text-xl p-2 text-right max-w-full rounded-md border-0"
										placeholder="0.0"
										min="0"
										max={tpokt_balance}
										name="burnPoktAmount"
										bind:value={burn_pokt_amount}
										on:input={validateBurnAmount}
										on:change={validateBurnAmount}
									/>
								</div>
							</label>
						</div>
						{#await balance_promise then balance}
							<a
								href="#_"
								on:click={() => {
									burn_pokt_amount = balance;
									validateBurnAmount();
								}}
								class="flex justify-end text-slate-400"
							>
								<span>tPOKT Balance: {balance}</span>
							</a>
						{:catch error}
							<span>Failed fetching tPOKT balance: </span><span class="text-red-500"
								>Error: {error.message}.</span
							>
							<button class="py-2 px-4 bg-slate-400" on:click={() => refreshBalances()}
								>Retry?</button
							>

							{console.error('Failed fetching tpokt balance', error) || ''}
						{/await}
					</div>
					{#if tpokt_balance == 0}
						<h3 class="text-center text-lg mt-5">Your tPOKT balance is empty.</h3>
						<a href="/swap" target="_blank" class="btn-primary  mt-5">
							<strong>BUY MORE tPOKT</strong>
						</a>
					{:else}
						<button
							disabled={!is_valid_burn_amount || tpokt_balance == 0}
							on:click={() => (curr_page = 2)}
							class="btn-secondary  mt-10"
						>
							<strong>ENTER POKT ADDRESS</strong>
						</button>
					{/if}
				{/if}
			</div>
		{:else if curr_page == 2}
			<!-- Step 2. Review POKT Address -->
			<div>
				<div><h3 class="text-2xl text-center mb-5">Enter POKT Address</h3></div>

				<p>
					Please enter your POKT address. This is <strong><i>NOT</i></strong> an Ethereum address.
				</p>
				<br />
				<p>
					You can make a new POKT wallet here: <a
						class="underline text-sky-500"
						target="_blank"
						href="https://wallet.pokt.network">wallet.pokt.network</a
					>.
				</p>
				<br />

				<div class="group">
					<div class="relative">
						<label for="poktAddress">
							<span class="sr-only">Your POKT Address</span>

							{#if !is_valid_pokt_address}
								<p class="text-red-500">
									That POKT address is invalid. Are you sure you entered it correctly?
								</p>
							{/if}

							<div
								class="mt-1 flex w-full items-center rounded-md bg-white  border-2 border-gray-300 shadow-sm focus:border-sky-300 focus:ring focus:ring-sky-200 focus:ring-opacity-50 h-16 text-xl"
							>
								<img
									class="inline-flex p-2 h-8 md:h-12 rounded-l-md"
									src="/img/pokt.svg"
									alt="POKT"
								/>
								<input
									type="text"
									id="poktAddress"
									class:border-red-500={!is_valid_pokt_address && pokt_address.length !== 0}
									class="inline-flex flex-grow h-8 md:h-12 md:text-xl p-2 text-right max-w-full rounded-md border-0"
									placeholder="Your POKT Address"
									name="poktAddress"
									bind:value={pokt_address}
									on:change={validate_pokt_address}
									on:input={validate_pokt_address}
								/>
							</div>
						</label>
					</div>
				</div>
				<div class="mt-5">
					<button
						class="btn-primary"
						disabled={!is_valid_pokt_address || pokt_address.length === 0}
						on:click={() => {
							validate_pokt_address();
							if (is_valid_pokt_address) {
								curr_page = 3;
							}
						}}
					>
						<strong>THIS IS MY ADDRESS</strong>
					</button>
				</div>
			</div>
		{:else if curr_page == 3}
			<div>
				<div class="text-center mb-10"><span class="mx-auto text-6xl">✋🛑</span></div>
				<div>
					<h3 class="text-2xl text-center mb-5">🚨 Verify Your Address 🚨</h3>
				</div>
				<p>
					Please verify <a
						target="_blank"
						class="underline text-blue-500"
						href={`https://pokt.watch/address/${pokt_address}`}
						title="POKT Watch">on POKT Watch</a
					> that this is your POKT address.
				</p>
				<br />
				<CopyableTextArea text={pokt_address} />
				<br />
				<p class="text-lg text-red-500">
					⚠️ If this is not your address you will <strong>lose</strong> all of your funds
				</p>
				<br />

				<button
					class="btn-primary"
					on:click={() => {
						curr_page = 4;
						promise = null;
						burn_tx_promise = null;
						burn_receipt_promise = null;
					}}
				>
					<strong>I UNDERSTAND, LET'S REVIEW</strong>
				</button>
			</div>
		{:else if curr_page == 4}
			<div>
				<div>
					<div class="flex items-center justify-center space-x-4 mb-10">
						<img class="inline-flex h-8 md:h-16" src="/img/tpokt.png" alt="tPOKT" />

						<!-- Heroicon/plus -->
						<svg
							xmlns="http://www.w3.org/2000/svg"
							class="h-10 w-10"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
							stroke-width="2"
						>
							<path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
						</svg>
						<span class="text-2xl md:text-6xl">🔥</span>

						<!-- Heroicon/arrow-sm-right -->
						<svg
							xmlns="http://www.w3.org/2000/svg"
							class="h-10 w-10"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
							stroke-width="2"
						>
							<path stroke-linecap="round" stroke-linejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
						</svg>
						<img class="inline-flex h-8 md:h-16" src="/img/pokt.svg" alt="POKT" />
					</div>

					<h3 class="text-2xl md:text-2xl text-center mb-5">Burning tPOKT for POKT</h3>

					<div class="border-t border-gray-200">
						<dl>
							<div class="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
								<dt class="text-sm font-medium text-gray-500">Burning:</dt>
								<dd class="mt-1 md:text-lg text-gray-900 sm:mt-0 sm:col-span-2 sm:text-right">
									{burn_pokt_amount} tPOKT
									<img class="inline-flex h-4" src="/img/tpokt.png" alt="POKT" />
								</dd>
							</div>
							<div class="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
								<dt class="text-sm font-medium text-gray-500">Receiving in 21-28 days:</dt>
								<dd class="mt-1 md:text-lg text-gray-900 sm:mt-0 sm:col-span-2 sm:text-right">
									{burn_pokt_amount} POKT
									<img class="inline-flex h-4" src="/img/pokt.svg" alt="POKT" />
								</dd>
							</div>
							<div class="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
								<dt class="text-sm font-medium text-gray-500">To POKT Address:</dt>
								<dd
									class="mt-1 md:text-lg text-gray-900 sm:mt-0 sm:col-span-2 sm:text-right text-ellipsis overflow-hidden"
									title={pokt_address}
								>
									{pokt_address}
								</dd>
							</div>
						</dl>
					</div>
				</div>

				<br />

				{#if burn_tx_promise}
					{#await burn_tx_promise}
						<p class="text-center">Submitting TX</p>
					{:catch error}
						<p class="text-red-500">Something went wrong! Error: {error.message}</p>
					{/await}
				{/if}
				<button disabled={!!promise} class="btn-primary mt-5" on:click={submitBurnTx}>
					<strong>BURN</strong>
				</button>
			</div>
		{:else if curr_page == 5}
			<div>
				<div>
					<h3 class="text-2xl md:text-2xl text-center mb-5">
						{#await burn_receipt_promise}
							Waiting for TX Confirmation
						{:then receipt}
							Burn Completed
						{:catch error}
							Something went wrong!
						{/await}
					</h3>

					{#await burn_tx_promise then tx}
						<p class="max-w-full text-ellipsis overflow-hidden">
							Burn submitted with transaction hash: {tx.hash}. You will receive your POKT in 21-28
							days.
						</p>
						<br />
						<p>TX Hash:</p>
						<CopyableTextArea text={tx.hash} />
						<br />
					{:catch error}
						{@debug error}
						<p class="text-red-500">Something went wrong! Error: {error.message}</p>
					{/await}
				</div>

				<button
					class="btn-primary mt-5"
					on:click={async () => {
						curr_page = 1;
					}}
				>
					<strong>BURN MORE tPOKT</strong>
				</button>
			</div>
		{/if}

		<div class="flex justify-center mt-10">
			<nav class="pagination" aria-label="Pagination">
				<!-- Current: "", Default: "bg-white border-gray-300 text-gray-500 hover:bg-gray-50" -->
				<button
					on:click={(e) => (curr_page = 1)}
					class:active={curr_page == 1}
					disabled={curr_page == 5}
					class="bg-white border-gray-300 text-gray-500 hover:bg-gray-50 relative inline-flex items-center px-4 py-2 md:px-8 md:py-4 border text-xs md:text-lg font-medium disabled:pointer-events-none disabled:hover:cursor-not-allowed"
				>
					1
				</button>
				<button
					on:click={(e) => (curr_page = 2)}
					class:active={curr_page == 2}
					disabled={burn_pokt_amount <= 0 || !is_valid_burn_amount}
					class="bg-white border-gray-300 text-gray-500 hover:bg-gray-50 relative inline-flex items-center px-4 py-2 md:px-8 md:py-4 border text-xs md:text-lg font-medium disabled:pointer-events-none disabled:hover:cursor-not-allowed"
				>
					2
				</button>
				<button
					on:click={(e) => (curr_page = 3)}
					class:active={curr_page == 3}
					disabled={pokt_address == '' || !is_valid_pokt_address}
					class="bg-white border-gray-300 text-gray-500 hover:bg-gray-50 inline-flex relative items-center px-4 py-2 md:px-8 md:py-4 border text-xs md:text-lg font-medium disabled:pointer-events-none disabled:hover:cursor-not-allowed"
				>
					3
				</button>
				<button
					on:click={(e) => (curr_page = 4)}
					class:active={curr_page == 4}
					disabled={curr_page != 4}
					class="bg-white border-gray-300 text-gray-500 hover:bg-gray-50 inline-flex relative items-center px-4 py-2 md:px-8 md:py-4 border text-xs md:text-lg font-medium disabled:pointer-events-none disabled:hover:cursor-not-allowed"
				>
					4
				</button>
				<button
					on:click={(e) => (curr_page = 5)}
					class:active={curr_page == 5}
					disabled={curr_page != 5}
					class="bg-white border-gray-300 text-gray-500 hover:bg-gray-50 inline-flex relative items-center px-4 py-2 md:px-8 md:py-4 border text-xs md:text-lg font-medium disabled:pointer-events-none disabled:hover:cursor-not-allowed"
				>
					5
				</button>
			</nav>
		</div>
	</div>
</main>
