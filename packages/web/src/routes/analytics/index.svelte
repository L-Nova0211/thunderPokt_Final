<script lang="ts">
	import { browser } from '$app/env';
	import Errors from '$lib/components/Errors.svelte';
	import Loading from '$lib/components/Loading.svelte';
	import {
		ThunderPOKTPolygonMainnetAddress,
		ThunderPOKTPolygonMainnetDecimals,
		ThunderPOKTWalletAddress
	} from '$lib/constants';
	import { tpoktContract } from '$lib/contracts/tpokt';
	import { Chart, registerables } from 'chart.js/dist/chart.esm';
	Chart.register(...registerables);
	import dayjs from 'dayjs';
	dayjs.extend(utc);
	import utc from 'dayjs/plugin/utc.js';
	import { ethers } from 'ethers';
	import { onMount } from 'svelte';
	import { writable } from 'svelte/store';

	let promise;
	let num_formatter = new Intl.NumberFormat('en-us', { minimumFractionDigits: 2 });
	let tpokt_total_supply_promise;
	let fetch_balances_promise;
	let polygon_address;
	let search_address;
	let total_rewards_canvas;
	let total_balance_canvas;
	let total_rewards_chart;
	let total_balance_chart;
	let block_height;
	let avg_block_time;
	let blocks = writable([]);
	let tpokt_daily_percent_yield;
	let tpokt_annual_percent_yield;
	let latest_balance;
	let yesterday_balance;
	let two_days_ago_balance;
	let four_days_ago_balance;
	let eight_days_ago_balance;

	const contract_created_block = 24626620;
	const contract_created_at = dayjs('2022-02-06 18:29:37').utc(true).valueOf();

	async function getBlocks(height, avg_block_time) {
		let avg_blocks_per_day = Math.floor((24 * 60 * 60 * 1000) / avg_block_time);
		let now = dayjs().utc();
		let start_of_dayjs = now.startOf('day').subtract(1, 'second');
		let est_block_yesterday = Math.floor(
			height - (now.valueOf() - start_of_dayjs.valueOf()) / avg_block_time
		);
		let temp = 0;
		let blocks = [];

		blocks.push({ block: height, block_time: now }); //take today
		blocks.push({ block: est_block_yesterday, block_time: start_of_dayjs }); // take yesterday
		height = est_block_yesterday;

		for (var i = 0; i < 100; i++) {
			if (height - temp - avg_blocks_per_day < contract_created_block) {
				break;
			} else {
				blocks.push({
					block: height - temp - avg_blocks_per_day,
					block_time: start_of_dayjs.subtract(i + 1, 'day')
				});
			}
			temp += avg_blocks_per_day;
		}

		return await Promise.all(
			blocks.reverse().map((b) => {
				return getNearestBlock(b.block_time, b.block, avg_block_time);
			})
		);
	}

	async function getNearestBlock(block_time, height, avg_block_time) {
		let attempts = 5;
		const block_sensitivity = 3;
		const tpokt = tpoktContract();
		let block;
		let last_block;
		let next_block_height = height;

		while (attempts > 0) {
			block = await tpokt.provider.getBlock(next_block_height);

			// found invalid block but had one before return last one
			if (last_block && block === null) {
				block = last_block;
				break;
			}

			// how far off is this block
			let block_time_delta =
				dayjs(block.timestamp * 1000)
					.utc()
					.valueOf() - block_time;

			// close enough?
			if (Math.abs(block_time_delta) <= avg_block_time * block_sensitivity) {
				break;
			}

			last_block = block;
			// guess next block to try
			next_block_height = next_block_height - Math.floor(block_time_delta / avg_block_time);
			attempts--;
		}

		return {
			block: block,
			time: block_time
		};
	}

	async function start_fetch() {
		let now = dayjs().utc();
		let tpokt = tpoktContract();

		// start fetching
		block_height = await tpokt.provider.getBlockNumber();
		avg_block_time =
			(now.valueOf() - contract_created_at) / (block_height - contract_created_block);
		promise = getBlocks(block_height, avg_block_time);
		tpokt_total_supply_promise = tpokt.totalSupply();

		blocks.set(await promise);

		window.dayjs = dayjs;
		window.tpokt = tpokt;
	}

	async function rebaseFactor(height) {
		return await tpoktContract().yamsScalingFactor({ blockTag: height });
	}

	async function calculate_daily_percent_yield(curr_block, prev_block) {
		let [curr, prev] = await Promise.all([rebaseFactor(curr_block), rebaseFactor(prev_block)]);
		let curr_factor = parseInt(curr.toString());
		let prev_factor = parseInt(prev.toString());
		let daily_percent_yield = curr_factor / prev_factor;
		console.log('calculate_daily_percent_yield', {
			daily_percent_yield,
			curr_factor,
			prev_factor,
			curr_block,
			prev_block
		});
		return daily_percent_yield;
	}

	async function calculate_percent_yields(blocks) {
		let now = dayjs().utc();
		let curr_block = blocks.find((b) => now.subtract(1, 'day').isSame(b.time, 'day'));
		let prev_block = blocks.find((b) => now.subtract(2, 'day').isSame(b.time, 'day'));
		console.log({ curr_block, prev_block });
		if (!curr_block || !prev_block) return;
		let daily_percent_yield = await calculate_daily_percent_yield(
			curr_block.block.number,
			prev_block.block.number
		);

		tpokt_daily_percent_yield = ((daily_percent_yield - 1) * 100).toFixed(3);
		tpokt_annual_percent_yield = ((daily_percent_yield ** 365 - 1) * 100).toFixed(1);
	}

	async function find_balance(block) {
		let tpokt = tpoktContract();
		let blockTag = { blockTag: block.block.number };
		let balance = polygon_address
			? tpokt.balanceOf(polygon_address, blockTag)
			: tpokt.totalSupply(blockTag);
		return {
			block: block.block,
			balance: await balance,
			time: block.time
		};
	}

	async function calculate_reward(prev_balance_block, curr_balance_block) {
		let tpokt = tpoktContract();

		let [xfers_from, xfers_to] = await Promise.all(
			polygon_address
				? [
						tpokt.queryFilter(
							tpokt.filters.Transfer(polygon_address),
							prev_balance_block.block.number,
							curr_balance_block.block.number
						),
						tpokt.queryFilter(
							tpokt.filters.Transfer(null, polygon_address),
							prev_balance_block.block.number,
							curr_balance_block.block.number
						)
				  ]
				: [
						tpokt.queryFilter(
							tpokt.filters.Transfer(ethers.constants.AddressZero),
							prev_balance_block.block.number,
							curr_balance_block.block.number
						),
						tpokt.queryFilter(
							tpokt.filters.Transfer(null, ethers.constants.AddressZero),
							prev_balance_block.block.number,
							curr_balance_block.block.number
						)
				  ]
		);

		let total_mint_amount = xfers_from
			.filter((evt) => evt.args[0] == ethers.constants.AddressZero)
			.reduce((prev, curr) => prev.add(curr.args[2]), ethers.BigNumber.from('0'));
		let total_burn_amount = xfers_to
			.filter((evt) => evt.args[1] == ethers.constants.AddressZero)
			.reduce((prev, curr) => prev.add(curr.args[2]), ethers.BigNumber.from('0'));
		let total_xfers_from_amount = xfers_from
			.filter((evt) => evt.args[0] != ethers.constants.AddressZero)
			.reduce((prev, curr) => prev.add(curr.args[2]), ethers.BigNumber.from('0'));
		let total_xfers_to_amount = xfers_to
			.filter((evt) => evt.args[1] != ethers.constants.AddressZero)
			.reduce((prev, curr) => prev.add(curr.args[2]), ethers.BigNumber.from('0'));

		// daily rewards current balance - previous balance - mint amounts +  burn amounts
		let rewards = curr_balance_block.balance
			.sub(prev_balance_block.balance)
			.sub(total_mint_amount)
			.add(total_burn_amount)
			.sub(total_xfers_to_amount)
			.add(total_xfers_from_amount);

		if (rewards.lt('0')) rewards = ethers.BigNumber.from('0');

		return {
			rewards,
			prev_balance_block,
			curr_balance_block,
			xfers_from,
			xfers_to,
			total_xfers_from_amount,
			total_xfers_to_amount,
			...curr_balance_block
		};
	}

	async function calculate_balances(blocks) {
		fetch_balances_promise = Promise.all(blocks.map((b) => find_balance(b)));
		let balances = await fetch_balances_promise;
		update_balances_chart(balances);
		update_balance_breakdown(balances);
		await calculate_rewards(balances);
	}

	async function calculate_rewards(balances) {
		let rewards = await Promise.all(
			balances.reduce((rewards, curr_bal_block, idx) => {
				if (idx == 0) {
					return rewards;
				}
				let prev_bal_block = balances[idx - 1];
				rewards.push(calculate_reward(prev_bal_block, curr_bal_block));
				return rewards;
			}, [])
		);
		window.rewards = rewards;
		update_rewards_chart(rewards);
	}

	async function update_rewards_chart(rewards) {
		let dates = rewards.map((b) => b.time.format('YYYY-MM-DD'));
		let data = rewards
			.reduce((_rewards: Array<any>, cv: any, idx: number) => {
				if (idx == 0) {
					_rewards.push(cv.rewards);
					return _rewards;
				}
				_rewards.push(_rewards[idx - 1].add(cv.rewards));
				return _rewards;
			}, [])
			.map((r: ethers.BigNumber) => ethers.utils.formatUnits(r, ThunderPOKTPolygonMainnetDecimals));
		if (total_rewards_chart) total_rewards_chart.destroy();
		total_rewards_chart = add_chart(dates, 'tPOKT earned in rewards', data, total_rewards_canvas);
	}

	function update_balances_chart(balances) {
		let dates = balances.map((b) => b.time.format('YYYY-MM-DD'));
		let data = balances.map((b) =>
			ethers.utils.formatUnits(b.balance, ThunderPOKTPolygonMainnetDecimals)
		);
		if (total_balance_chart) total_balance_chart.destroy();
		let chart_title = search_address ? 'Supply over time' : 'Balance over time';
		total_balance_chart = add_chart(dates, chart_title, data, total_balance_canvas);
	}

	function add_chart(labels, dataset_label, dataset_data, canvas) {
		const data = {
			labels: labels,
			datasets: [
				{
					label: dataset_label,
					data: dataset_data,
					fill: true,
					borderColor: 'rgb(255,218,0)',
					backgroundColor: 'rgb(255,218,0, 0.1)',
					tension: 0.05
				}
			]
		};

		const config = {
			type: 'line',
			data: data,
			options: {
				legend: {
					display: false //This will do the task
				}
			}
		};
		return new Chart(canvas, config);
	}

	function update_balance_breakdown(balances) {
		const now = dayjs().utc();
		latest_balance = balances.find((b) => now.isSame(b.time, 'day')).balance;
		yesterday_balance = balances.find((b) => now.subtract(1, 'day').isSame(b.time, 'day')).balance;
		two_days_ago_balance = balances.find((b) =>
			now.subtract(2, 'day').isSame(b.time, 'day')
		).balance;
		four_days_ago_balance = balances.find((b) =>
			now.subtract(4, 'day').isSame(b.time, 'day')
		).balance;
		eight_days_ago_balance = balances.find((b) =>
			now.subtract(8, 'day').isSame(b.time, 'day')
		).balance;
	}

	function update_search_address() {
		let url_params = new URLSearchParams();
		if (polygon_address) {
			url_params.set('address', polygon_address);
		}
		search_address = polygon_address;
		window.location.search = url_params.toString();
		calculate_balances($blocks);
	}

	if (browser) {
		search_address = new URLSearchParams(window.location.search).get('address');
		if (search_address && search_address.length > 0) {
			polygon_address = search_address;
		}
		onMount(() => {
			blocks.subscribe((bs) => {
				window.blocks = bs;
				console.log('fetched blocks', bs.length);
				if (bs.length < 1) return;
				promise = Promise.all([calculate_percent_yields(bs), calculate_balances(bs)]).then(
					() => (promise = null)
				);
			});
		});

		start_fetch();
	}
</script>

<svelte:head>
	<title>ThunderPOKT | Analytics</title>
</svelte:head>

{#await promise}
	<!-- empty on purpose -->
{:catch error}
	{console.error(error) || ''}
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

<main class="container mx-auto flex-grow pb-16 px-4">
	<h1 class="text-4xl text-center my-10">Analytics</h1>

	<div class="bg-slate-50  rounded-md shadow-md py-8 px-4">
		<div class="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-6 text-center">
			<div class="flex flex-col col-span-1">
				<h4 class="text-xl font-semibold">
					{#if tpokt_annual_percent_yield}
						{tpokt_annual_percent_yield} %
					{:else}
						<span class="text-gray-500"><Loading /> Loading...</span>
					{/if}
					<br />
					<span class="text-lg text-gray-500">APY</span>
				</h4>
			</div>
			<div class="flex flex-col col-span-1">
				<h4 class="text-xl font-semibold">
					{#if tpokt_daily_percent_yield}
						{tpokt_daily_percent_yield} %
					{:else}
						<span class="text-gray-500"><Loading /> Loading...</span>
					{/if}
					<br />
					<span class="text-lg text-gray-500">Daily Return</span>
				</h4>
			</div>
			<div class="flex flex-col col-span-1">
				<h4 class="text-xl font-semibold">
					{#await tpokt_total_supply_promise}
						<span class="text-gray-500"><Loading /> Loading...</span>
					{:then total_supply}
						{#if total_supply}
							{num_formatter.format(
								ethers.utils.formatUnits(total_supply, ThunderPOKTPolygonMainnetDecimals)
							)}
						{/if}
					{:catch error}
						{error.message}
					{/await} <br />
					<span class="text-lg text-gray-500">tPOKT Total Supply</span>
				</h4>
			</div>
			<form
				class="flex items-center justify-center  col-span-1 md:col-span-3 w-full px-4 mt-8 md:mt-0"
				on:submit|preventDefault={update_search_address}
			>
				<div class="group flex-grow">
					<div class="relative">
						<label for="polygonAddress">
							<span class="sr-only">Polygon Wallet</span>
							<div
								class="flex w-full items-center rounded-md bg-white  border-2 border-gray-300 shadow-sm focus:border-sky-300 focus:ring focus:ring-sky-200 focus:ring-opacity-50 h-16 text-xl border-collapse"
							>
								<input
									type="text"
									id="polygonAddress"
									class="inline-flex flex-grow h-8 md:h-12 md:text-xl text-right max-w-full rounded-md border-0"
									placeholder="Your Polygon Address"
									name="polygonAddress"
									bind:value={polygon_address}
								/>
							</div>
						</label>
					</div>
				</div>
				<div class="">
					<button type="submit" class="btn-primary h-16 w-full">
						<span class="sr-only">Search</span>
						<!-- Heroicons outline/search -->
						<svg
							xmlns="http://www.w3.org/2000/svg"
							class="h-6 w-6"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
							stroke-width="2"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
							/>
						</svg>
					</button>
				</div>
			</form>
		</div>
	</div>

	<div class="bg-slate-50  rounded-md shadow-md py-16 px-4 mt-10">
		<div>
			<h3 class="text-2xl text-center mb-5">
				{#if search_address}
					<strong>tPOKT Balance:</strong>
					{search_address.slice(0, 6)}...{search_address.slice(
						search_address.length - 4,
						search_address
					)}
				{:else}
					<strong>Total Supply and Rewards</strong>
				{/if}
			</h3>
		</div>

		<div class="grid grid-cols-1 md:grid-cols-4 gap-6 text-center">
			<div class="flex flex-col col-span-1">
				<h4 class="text-xl font-semibold">
					{#if latest_balance}
						{num_formatter.format(
							ethers.utils.formatUnits(latest_balance, ThunderPOKTPolygonMainnetDecimals)
						)}
					{:else}
						<span class="text-gray-500"><Loading /> Loading...</span>
					{/if}
					<br />
					<span class="text-lg text-gray-500"
						>tPOKT Total {#if search_address}Balance{:else}Supply{/if}</span
					>
				</h4>
			</div>
			<div class="flex flex-col col-span-1">
				<h4 class="text-xl font-semibold">
					{#if two_days_ago_balance && yesterday_balance}
						{num_formatter.format(
							ethers.utils.formatUnits(
								yesterday_balance.sub(two_days_ago_balance),
								ThunderPOKTPolygonMainnetDecimals
							)
						)}
					{:else}
						<span class="text-gray-500"><Loading /> Loading...</span>
					{/if}
					<br />
					<span class="text-lg text-gray-500">1D Growth</span>
				</h4>
			</div>
			<div class="flex flex-col col-span-1">
				<h4 class="text-xl font-semibold">
					{#if yesterday_balance && four_days_ago_balance}
						{num_formatter.format(
							ethers.utils.formatUnits(
								yesterday_balance.sub(four_days_ago_balance),
								ThunderPOKTPolygonMainnetDecimals
							)
						)}
					{:else}
						<span class="text-gray-500"><Loading /> Loading...</span>
					{/if}
					<br />
					<span class="text-lg text-gray-500">3D Growth</span>
				</h4>
			</div>
			<div class="flex flex-col col-span-1">
				<h4 class="text-xl font-semibold">
					{#if yesterday_balance && eight_days_ago_balance}
						{num_formatter.format(
							ethers.utils.formatUnits(
								yesterday_balance.sub(eight_days_ago_balance),
								ThunderPOKTPolygonMainnetDecimals
							)
						)}
					{:else}
						<span class="text-gray-500"><Loading /> Loading...</span>
					{/if}
					<br />
					<span class="text-lg text-gray-500">7D Growth</span>
				</h4>
			</div>
		</div>
		<div class="flex flex-col col-span-1">
			<div class="mt-16 flex flex-col min-h-[30rem]">
				<h2 class="text-2xl text-center">tPOKT Total Rewards</h2>
				<div class="relative">
					{#if !total_rewards_chart}
						<div
							class="w-full text-center flex-grow h-full flex flex-col justify-center absolute mx-auto"
						>
							<span class="text-gray-500"><Loading /> Loading...</span>
						</div>
					{/if}
					<canvas id="total_rewards_canvas" class="w-full" bind:this={total_rewards_canvas} />
				</div>
			</div>
			<div class="mt-16 flex flex-col min-h-[30rem]">
				<h2 class="text-2xl text-center">
					tPOKT Total {#if search_address}Balance{:else}Supply{/if}
				</h2>
				<div class="relative">
					{#if !total_balance_chart}
						<div
							class="w-full text-center flex-grow h-full flex flex-col justify-center absolute mx-auto"
						>
							<span class="text-gray-500"><Loading /> Loading...</span>
						</div>
					{/if}
					<canvas id="total_balance_canvas" class="w-full" bind:this={total_balance_canvas} />
				</div>
			</div>
		</div>
		<p style="pt-16">
			<strong>Disclaimer</strong> this is for informational purposes only, and could be incorrect. We
			are not liable for any financial decisions you make based on the information presented.
		</p>
	</div>
</main>

<style>
	.btn-primary {
		@apply px-4 py-4;
	}
</style>
