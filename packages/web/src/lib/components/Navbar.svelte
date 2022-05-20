<script lang="ts">
	import { fade } from 'svelte/transition';
	import { page } from '$app/stores';
	import { browser } from '$app/env';
	import { DocsUrl, PolygonNetworkVersion, SushiUrl } from '$lib/constants';
	import Errors from '$lib/components/Errors.svelte';
	import { accounts, requestAccounts } from '$lib/stores/dapp';
	import ErrorModal from './ErrorModal.svelte';

	let is_home = $page.url.pathname === '/';
	let menu_open = false;

	if (browser) {
		page.subscribe((cur_page) => {
			is_home = cur_page.url.pathname === '/';
		});
	}

	let promise = null;
</script>

<div class="min-h-full">
	<nav class="">
		<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
			<div class="flex items-center justify-between h-32">
				<div class="flex items-center">
					<div class="flex-shrink-0">
						<a sveltekit:prefetch href="/" aria-current={is_home} class="block group mr-10"
							><h1 class="text-gray-700">
								<img
									class="inline-block align-bottom h-10 w-10"
									src="/img/tpokt.png"
									alt="ThunderPOKT"
								/>
								<span class="text-2xl md:text-4xl ml-4 font-semibold">ThunderPOKT</span>
							</h1>
						</a>
					</div>
				</div>
				<div class="hidden md:block">
					<div class="ml-4 flex items-center md:ml-6">
						<div class="flex items-baseline space-x-4 space-y-4">
							<ul>
								{#if is_home}
									<!-- ThunderPOKT Home -->
									<li>
										<a
											sveltekit:prefetch
											href="/mint"
											aria-current={$page.url.pathname === '/mint' ? 'page' : false}
											class:active={$page.url.pathname === '/mint' ? 'page' : false}>Enter App</a
										>
									</li>
									<li>
										<a href={DocsUrl} target="_blank">How?</a>
									</li>
								{:else}
									<!-- ThunderPOKT Dashboard -->
									<li>
										<a
											sveltekit:prefetch
											href="/analytics"
											aria-current={$page.url.pathname === '/analytics' ? 'page' : false}
											class:active={$page.url.pathname === '/analytics' ? 'page' : false}
											>Analytics</a
										>
									</li>
									<li>
										<a
											sveltekit:prefetch
											href="/mint"
											aria-current={$page.url.pathname === '/mint' ? 'page' : false}
											class:active={$page.url.pathname === '/mint' ? 'page' : false}>Mint</a
										>
									</li>
									<li>
										<a
											sveltekit:prefetch
											href="/burn"
											aria-current={$page.url.pathname === '/burn' ? 'page' : false}
											class:active={$page.url.pathname === '/burn' ? 'page' : false}>Burn</a
										>
									</li>
									<li>
										<a
											sveltekit:prefetch
											href="/wrap"
											aria-current={$page.url.pathname === '/wrap' ? 'page' : false}
											class:active={$page.url.pathname === '/wrap' ? 'page' : false}>Wrap</a
										>
									</li>
									<li>
										<a href="/swap" target="_blank" aria-current="false">Swap</a>
									</li>
									<li>
										<a
											sveltekit:prefetch
											href="/stake"
											aria-current={$page.url.pathname === '/stake' ? 'page' : false}
											class:active={$page.url.pathname === '/stake' ? 'page' : false}>Stake</a
										>
									</li>
									<li>
										<a href={DocsUrl} target="_blank" aria-current="false">User&nbsp;Guide</a>
									</li>
								{/if}
							</ul>
							<div class="ml-3 relative">
								<div>
									{#if $accounts[0]}
										<span class="text-gray-700"
											>Connected as {$accounts[0].slice(0, 6)}...<span class="hidden md:inline"
												>{$accounts[0].slice($accounts[0].length - 4, $accounts[0])}</span
											></span
										>
									{:else}
										<a href="#_" on:click|preventDefault={() => (promise = requestAccounts())}>
											<strong>Connect Wallet</strong>
										</a>
									{/if}
								</div>
							</div>
						</div>
					</div>
				</div>
				<div class="-mr-2 flex md:hidden">
					<!-- Mobile menu button -->
					<button
						type="button"
						class="bg-gray-800 inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-white"
						aria-controls="mobile-menu"
						aria-expanded={menu_open}
						on:click={() => (menu_open = !menu_open)}
						transition:fade
					>
						<span class="sr-only">Open main menu</span>
						<!--
              Heroicon name: outline/menu

              Menu open: "hidden", Menu closed: "block"
            -->
						<svg
							class="block h-6 w-6"
							xmlns="http://www.w3.org/2000/svg"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
							aria-hidden={menu_open}
							class:hidden={menu_open}
							class:block={!menu_open}
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M4 6h16M4 12h16M4 18h16"
							/>
						</svg>
						<!--
              Heroicon name: outline/x

              Menu open: "block", Menu closed: "hidden"
            -->
						<svg
							class="hidden h-6 w-6"
							xmlns="http://www.w3.org/2000/svg"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
							aria-hidden={!menu_open}
							class:hidden={!menu_open}
							class:block={menu_open}
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M6 18L18 6M6 6l12 12"
							/>
						</svg>
					</button>
				</div>
			</div>
		</div>

		<!-- Mobile menu, show/hide based on menu state. -->
		{#if menu_open}
			<div transition:fade={{ duration: 400 }} class="md:hidden bg-white" id="mobile-menu">
				<div class="px-2 pt-2 pb-3 space-y-1 sm:px-3">
					{#if is_home}
						<a
							sveltekit:prefetch
							href="/mint"
							aria-current={$page.url.pathname === '/mint' ? 'page' : false}
							class:active={$page.url.pathname === '/mint' ? 'page' : false}>Enter App</a
						>
						<a href={DocsUrl} target="_blank">How?</a>
					{:else}
						<!-- ThunderPOKT Dashboard -->

						<a
							sveltekit:prefetch
							href="/analytics"
							aria-current={$page.url.pathname === '/analytics' ? 'page' : false}
							class:active={$page.url.pathname === '/analytics' ? 'page' : false}>Analytics</a
						>
						<a
							sveltekit:prefetch
							href="/mint"
							aria-current={$page.url.pathname === '/mint' ? 'page' : false}
							class:active={$page.url.pathname === '/mint' ? 'page' : false}>Mint</a
						>
						<a
							sveltekit:prefetch
							href="/burn"
							aria-current={$page.url.pathname === '/burn' ? 'page' : false}
							class:active={$page.url.pathname === '/burn' ? 'page' : false}>Burn</a
						>
						<a
							sveltekit:prefetch
							href="/wrap"
							aria-current={$page.url.pathname === '/wrap' ? 'page' : false}
							class:active={$page.url.pathname === '/wrap' ? 'page' : false}>Wrap</a
						>
						<a href="/swap" target="_blank" aria-current="false">Swap</a>
						<a
							sveltekit:prefetch
							href="/stake"
							aria-current={$page.url.pathname === '/stake' ? 'page' : false}
							class:active={$page.url.pathname === '/stake' ? 'page' : false}>Stake</a
						>
						<a href={DocsUrl} target="_blank" aria-current="false">User Guide</a>
					{/if}
				</div>
				<div class="pt-4 pb-3 border-t border-gray-700">
					<div class="flex items-center px-5">
						{#if $accounts[0]}
							<span class="text-gray-700"
								>Connected as {$accounts[0].slice(0, 6)}...{$accounts[0].slice(
									$accounts[0].length - 4,
									$accounts[0]
								)}</span
							>
						{:else}
							<button
								on:click={() => (promise = requestAccounts())}
								class="btn-primary"
								type="button"
								name="button"
							>
								<strong>Connect Wallet</strong>
							</button>
						{/if}
					</div>
				</div>
			</div>
		{/if}
	</nav>
</div>

<ErrorModal {promise} />

<style lang="postcss">
	nav .active {
		@apply z-10 bg-sky-50 border-sky-500 text-sky-600;
	}

	nav li {
		@apply inline-block my-2;
	}

	nav li a {
		@apply text-gray-700 hover:bg-gray-700 hover:text-white px-3 py-2 rounded-md text-xl font-medium;
	}

	nav li a .active {
		@apply bg-gray-900 text-white;
	}

	#mobile-menu a {
		@apply text-gray-700 hover:bg-gray-700 hover:text-white block px-6 py-4 rounded-md text-xl font-medium;
	}

	#mobile-menu .active {
		@apply bg-gray-900 text-white;
	}
</style>
