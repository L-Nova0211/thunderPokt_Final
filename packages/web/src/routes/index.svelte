<script lang="ts">
	import { DocsUrl, TelegramUrl, ThunderStakeUrl } from '$lib/constants';
</script>

<svelte:head>
	<title>ThunderPOKT</title>
</svelte:head>

<!-- This example requires Tailwind CSS v2.0+ -->
<div class="relative overflow-hidden min-h-screen max-h-[1500px] md:pt-[5vh]">
	<div class="max-w-7xl mx-auto ">
		<div class="relative z-10 pb-8 sm:pb-16 md:pb-20 lg:pb-28 xl:pb-32">
			<main class="mt-10 mr-auto px-4 sm:mt-12 sm:px-6 md:mt-16 lg:mt-20 lg:px-8 xl:mt-28">
				<div class="flex flex-col lg:flex-row justify-center items-center">
					<div class="order-1 md:max-w-md lg:max-w-4xl sm:text-center lg:text-left">
						<h1
							class="text-4xl tracking-tight font-extrabold text-gray-900 sm:text-5xl md:text-6xl"
						>
							<span class="block xl:inline">Providing Liquidity for</span>
							<span class="block text-yellow-300 xl:inline">Staked Assets</span>
						</h1>
						<p
							class="mt-3 text-base text-gray-500 sm:mt-5 sm:text-lg sm:max-w-xl sm:mx-auto md:mt-5 md:text-xl lg:mx-0"
						>
							Instant liquidity for staked assets
						</p>
						<div class="mt-5 sm:mt-8 sm:flex sm:justify-center lg:justify-start">
							<div class="rounded-md shadow">
								<a target="_blank" href="/swap" class="btn-tertiary"> BUY </a>
							</div>
							<div class="mt-3 sm:mt-0 sm:ml-3">
								<a sveltekit:prefetch href="/mint" class="btn-primary"> MINT </a>
							</div>
						</div>
					</div>
					<div class="h-full p-16 order-[-1] lg:order-1">
						<div
							class="rounded-full max-w-full w-72 sm:w-96 object-fit md:w-96 lg:w-96 xl:w-[33rem] mx-auto"
						>
							<img class="w-full object-fit p-12" src="/img/tpokt.png" alt="" />
						</div>
					</div>
				</div>
			</main>
		</div>
	</div>
</div>

<div class="bg-white text-center align-center flex justify-center md:p-16">
	<div class="container mx-auto p-5">
		<h1 class="text-2xl md:text-4xl lg:text-6xl mb-5">How ThunderPOKT Works</h1>
		<p>tPOKT is a state of the art system that gives instant liquidity to staked POKT</p>

		<div class="max-w-full md:columns-3 mt-12 md:mt-24 space-y-8 md:space-x-4">
			<div class="">
				<img src="/img/how-it-works/money-vector.svg" height="100" alt="" class="h-32 mx-auto" />
				<h4 class="text-xl md:text-3xl mb-4">Stake</h4>
				<p>
					ThunderPOKT lets users stake their POKT for hourly staking rewards (compounding). Users
					can stake any amount of POKT (no minimum)
				</p>
			</div>
			<div class="">
				<img src="/img/how-it-works/printer.jpg" height="100" alt="" class="h-32 mx-auto" />
				<h4 class="text-xl md:text-3xl mb-4">Mint</h4>
				<p>
					When staking tPOKT you mint staked tokens which are pegged 1:1 to a POKT staked in a node.
					Your tPOKT can be used all across DeFi
				</p>
			</div>
			<div class="">
				<img src="/img/how-it-works/circle.jpg" height="100" alt="" class="h-32 mx-auto" />
				<h4 class="text-xl md:text-3xl mb-4">DeFi</h4>
				<p>tPOKT is an ERC-20 token, so it is usable all across DeFi</p>
			</div>
		</div>
		<div class="mt-24">
			<div class="bg-slate-100 rounded-xl p-10 max-w-2xl mx-auto">
				<h3 class="text-2xl">Detailed Docs</h3>
				<p>Read a more detailed explanation about tPOKT</p>

				<div class="grid grid-cols-1 md:grid-cols-2 gap-4 w-full justify-center mt-8">
					<a target="_blank" href={DocsUrl} class="btn-secondary"> DOCS </a>
					<a target="_blank" href={TelegramUrl} class="btn-tertiary"> Ask Questions </a>
				</div>
			</div>
		</div>
	</div>
</div>
<div class="bg-sky-900 text-center text-white">
	<div class="container mx-auto p-16">
		<h1 class="text-4xl">Validators</h1>

		<h5 class="mt-4 text-2xl">
			Powered by <a class="underline" href={ThunderStakeUrl} target="_blank">ThunderStake</a>
		</h5>
		<p>
			ThunderStake is a premier node provider which consistently performs above the network average.
		</p>
	</div>
</div>
