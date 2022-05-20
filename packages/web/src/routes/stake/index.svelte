<script lang="ts">
	import { wtpoktContract } from '$lib/contracts/wtpokt';
	import { StakingRewardContract } from '$lib/contracts/stakert';
	import { nftManagerPositionsContract } from '$lib/contracts/nftmt';
	import { NFTOracle } from '$lib/contracts/oracle';
	import { UniPool } from '$lib/contracts/pool';
	import { tooltip } from '$lib/components/tooltip'
	import _flatten from 'lodash/flatten.js';
	import _orderBy from 'lodash/orderBy.js';
	import {
		Staking_reward_address,
		PolygonNetworkVersion,
		WrappedThunderPOKTPolygonMainnetDecimals,
		ThunderPOKTPolygonMainnetDecimals,
		wtPOKTPolygonMainnetAddress,
		wtPOKTUSDCPoolAddress,
	} from '$lib/constants';
	import { accounts, requestAccounts, selectedChain, selectedProvider } from '$lib/stores/dapp';
	import { toBigNumber, formatUnits, sumOfBigNumber, toFixed } from '$lib/utils/big-number';
	import { equalAddress } from '$lib/utils/address';
	import moment from 'moment';
	import axios from 'axios';
	//@ts-ignore
	import { SvelteToast } from '@zerodevx/svelte-toast'
	import { toast } from '@zerodevx/svelte-toast'
	import Loading from '$lib/components/Loading.svelte';
	// import Flat from './component/Flat.svelte'
	import Flatpickr from 'svelte-flatpickr'
	import { BigNumber } from 'ethers';
	import { ethers } from 'ethers';

	let latestIncentive = {
		rewardToken: '',
		pool: '',
		startTime: 0, // Apr 19, 2022 new Date( "2022-04-19 20:45:00" ).getTime()
		endTime: 0,	// Apr 19, 2022
		refundee: "",
		wtAmount: 0
	};
	let stakeTokens = {};
	let wtPOKTDailyReward = 0;
	let sqrtPriceX96 = toBigNumber(0);
	let tooltipContent

	getLatestIncentive();
	async function getLatestIncentive() {
		try {
			await axios
			.get("https://api.thunderpokt.fi" + "/thunderpokt/getLatestIncentive")
			.then(res => {
				latestIncentive = res.data.latestIncentive;
			});
			wtPOKTDailyReward = Math.floor(latestIncentive.wtAmount/((latestIncentive["endTime"] - latestIncentive["startTime"])/86400));
		}
		catch {
			console.log("API not working.")
		}
	}

	function getPrice() {
		return fetch("https://api.coingecko.com/api/v3/simple/price?ids=wrapped-thunderpokt&vs_currencies=usd")
		.then(async function(result) {
			return (await result.json())["wrapped-thunderpokt"]["usd"]
		})
	}
	let price = getPrice()

	getIncentive();
	async function getIncentive() {
		try {
			await axios
			.post("https://api.thegraph.com/subgraphs/name/dragondmoney/wtpokt_staking", {"query":"query MyQuery {\n  positions(orderDirection: desc, where: {staked: true}) {\n    tokenId\n    state\n    approved\n    staked\n    owner\n    oldOwner\n  }\n}","variables":null,"operationName":"MyQuery","extensions":{"headers":null}})
			.then(res => {
				stakeTokens = res.data.data.positions;
			});
		}
		catch {
			console.log("API not working.")
		}
	}

	let status = {};
	getStates();
	let states = {};
	async function getStates() {
		try {
			await axios
			.post("https://api.thegraph.com/subgraphs/name/dragondmoney/wtpokt_staking", {"query":"query MyQuery {\n  positions(orderDirection: desc, where: {state_not: \"\"}) {\n    tokenId\n    state\n    approved\n    staked\n    owner\n    oldOwner\n    timestamp\n  }\n}","variables":null,"operationName":"MyQuery","extensions":{"headers":null}})
			.then(res => {
				states = res.data.data.positions;
			});
			states.map(state => {
				status[state.tokenId] = state.state;
			})
		}
		catch {
			console.log("API not working.")
		}
	}

	let stakedTokenTime = {};
	let fetches = {}

	let startpickr;
	let endpickr;
    let startDate = null;
	let endDate = null;
	let startTime = "";
	let endTime = "";

    const startTimeOptions = {
      	element: '#start-picker',
			enableTime: true,
			altInput: true,
			wrap: true,
      	altFormat: "F j, Y",
      	dateFormat: "Y-m-d",

		onClose: function(selectedDates){
        	startTime = new Date(selectedDates[0]).getTime().toString();
		},
		onOpen: function() {
			console.log('startTime');
		}
    }

	const endTimeOptions = {
      	element: '#end-picker',
			enableTime: true,
			altInput: true,
			wrap: true,
      	altFormat: "F j, Y",
      	dateFormat: "Y-m-d",

		onClose: function(selectedDates){
        	endTime = new Date(selectedDates[0]).getTime().toString();
		},
		onOpen: function() {
			console.log('endTime');
		}
    }

	const options = {
		duration: 3000,
		placement: 'top-right',
		type: 'success',
		theme: 'light',
	}

	const beginningTokenId = 0;
	let promise = null;

	function formatTimestamp(unix: number) {
		return moment.unix(unix).local().format('YYYY-MM-DD HHmm[h]');
	}

	let address = null;
	let _positions = [];
	let _rewards_promise = null;
	let balance = 0;
	const loadPosition = async (
		owner: string,
		index: number
    ) => {
		const tokenId = await nftManagerPositionsContract().tokenOfOwnerByIndex(
			owner,
			index
		);
		const { liquidity } = await nftManagerPositionsContract().positions(
			tokenId
		);
		if (liquidity.isZero()) return null;
		const position = await StakingRewardContract().deposits(tokenId);
		if (!equalAddress(owner, address) && !equalAddress(position.owner, address)) return null;
		let staked = false;
		let reward = toBigNumber(0);
		try {
			const [rewardNumber] = await StakingRewardContract().getRewardInfo(
				latestIncentive,
				tokenId
			);
			reward = toBigNumber(rewardNumber.toString());
			staked = true;
		} catch {}
		const obj = await NFTOracle().getPrice(tokenId.toNumber(), sqrtPriceX96)
		amount[tokenId] = (toBigNumber(obj[0])/toBigNumber(1000000)+((toBigNumber(obj[1])*toBigNumber(await price))/toBigNumber(10**WrappedThunderPOKTPolygonMainnetDecimals))).toFixed(2)
		// amount[tokenId.toString()]
		return {
			tokenId: Number(tokenId.toString()),
			owner,
			reward,
			staked,
		};
    };

	async function loadPositions(owner: string) {
		const noOfPositions = await nftManagerPositionsContract().balanceOf(owner);
		let positions = null;
		if (owner==Staking_reward_address) {

			const indexes = []
			for (let i = beginningTokenId; i < noOfPositions.toNumber(); i++) {
				indexes.push(i)
			}
			positions = await Promise.all(
				indexes
				.map((index) => loadPosition(owner, index))
			);
		}
		else {
			positions = await Promise.all(
				new Array(noOfPositions.toNumber())
				.fill(0)
				.map((_, index) => loadPosition(owner, index))
			);
		}
		const ownerPositions = [];
		positions.forEach((position) => {
			if (position) {
				ownerPositions.push(position);
			}
		});
		return ownerPositions;
	}

	async function getSqrtPriceX96() {
		const slot0 = await UniPool().slot0()
		return slot0[0]
	}

	getSqrtPriceX96().then(function(result) { sqrtPriceX96 = result })

	async function refreshRewards() {
		if (!$accounts[0]) return;
		address = $accounts[0];
		const owners: string[] = [address, Staking_reward_address];
		_rewards_promise = Promise.all(owners.map(loadPositions)).then(positions => {
			_positions = _orderBy(_flatten(positions), 'tokenId')
			refreshReward();
			return _positions
		})
	}
	accounts.subscribe(refreshRewards);

	let curr_page = 1;

	async function tx(
		startNotification: string,
		endNotification: string,
		makeTx: () => { hash: string; wait: () => Promise<any> }
	) {
		try {
		const { hash, wait } = await makeTx();
		// showTxNotification(startNotification, hash);
		await wait();
		// showTxNotification(endNotification, hash);
		} catch (e) {
		// showErrorNotification(e);
		throw e;
		}
	};

	let isClaiming = false;
	async function claimHandler() {
		let strc = StakingRewardContract().connect($selectedProvider.getSigner());
		try {
			isClaiming = true;
			const reward = await StakingRewardContract().rewards(
				latestIncentive.rewardToken,
				$accounts[0],
			)

			let res = await strc.claimReward(
				latestIncentive.rewardToken,
				$accounts[0],
				reward
			);
			await res.wait();
			toast.push('Successfully claimed');
			refreshReward()
		} catch (e) {
			toast.push('Claim Failed');
		} finally {
			isClaiming = false;
		}
	}

	async function getReward() {
		let res = await StakingRewardContract().rewards(
			latestIncentive.rewardToken,
			$accounts[0]
		)
		return res
	}

	let _reward_promise = null;
	async function refreshReward() {
		if (!$accounts[0]) return
		_reward_promise = Promise.all([getReward]).then(async (_rewards) => {
			return _rewards[0]();
		})
	}

	let flag = 0;
	async function approve(_tokenId) {
		flag = _tokenId + 1;
		if (!$accounts[0]) return
		let nftmpc = nftManagerPositionsContract().connect($selectedProvider.getSigner());
		try {
			let res = await nftmpc.approve(
				Staking_reward_address,
				_tokenId
			);
			await res.wait()
			status[_tokenId] = "Approved"
			toast.push('Approve Success');
		} catch(err) {
			flag = 0;
			toast.push('Approve Failed');
		} finally {
			flag = 0;
		}
	}
	async function transfer(_tokenId) {
		flag = _tokenId + 2;
		let nftmpc = nftManagerPositionsContract().connect($selectedProvider.getSigner());
		try {
			let res = await nftmpc[
				'safeTransferFrom(address,address,uint256)'
				]($accounts[0], Staking_reward_address, _tokenId);
			await res.wait();
			status[_tokenId] = "Deposited"
			toast.push('Deposit Success');
		} catch (err) {
			toast.push('Deposit Failed');
		} finally {
			flag = 0;
		}
	}
	async function stake(_tokenId) {
		flag = _tokenId + 3;
		let strc = StakingRewardContract().connect($selectedProvider.getSigner());
		try {
			let res = await strc.stakeToken(latestIncentive, _tokenId);
			await res.wait();
			status[_tokenId] = "Staked"
			await getIncentive();
			refreshTotalStaked();
			refreshRewards();
			toast.push('Staked Succesfully');
			wflag = 0
		} catch (err) {
			toast.push('Staking Failed');
		} finally {
			flag= 0;
		}
	}

	async function approveToken() {
		let tpkt = wtpoktContract().connect($selectedProvider.getSigner());
 		try{
			let wtDecimal = latestIncentive.wtAmount * Math.pow(10, 12);
			let res = await tpkt.approve(Staking_reward_address, wtDecimal)
			await res.wait()
			toast.push('Approve Success')
		} catch (err) {
			toast.push('Approve Failed')
		}
	}

	async function createIncentive() {
		let currentIncentive = {
			rewardToken: latestIncentive.rewardToken,
			pool: latestIncentive.pool,
			startTime: latestIncentive.startTime, // Apr 19, 2022 new Date( "2022-04-19 20:45:00" ).getTime()
			endTime: latestIncentive.endTime,	// Apr 19, 2022
			refundee: latestIncentive.refundee,
		}
		let strc = StakingRewardContract().connect($selectedProvider.getSigner());
		try {
			let wtDecimal = latestIncentive.wtAmount * Math.pow(10, 12);
			let res = await strc.createIncentive(currentIncentive, wtDecimal);
			await res.wait()
			toast.push('Created Successfully')
			getLatestIncentive();
			getIncentive()
			refreshTotalStaked()
			refreshRewards()
		} catch (err) {
			toast.push('Create Incentive Failed')
		} finally {

		}
	}

	let wflag = 0;
	async function unstake(_tokenId, stakedTime, next=() => {}) {
		wflag = _tokenId + 1;
		let incentiveKey = {};
		let lpUnStake = {
				stakedTime: stakedTime
			}
		await axios
		.post("https://api.thunderpokt.fi" + "/thunderpokt/getStakedIncentive", lpUnStake)
		.then(async res => {
			incentiveKey = res.data.stakedIncentive;
			let strc = StakingRewardContract().connect($selectedProvider.getSigner());
			try {

				let res = await strc.unstakeToken(incentiveKey, _tokenId);
				await res.wait()
				status[_tokenId] = "Deposited"
				toast.push('Unstaked Successfully');
				getLatestIncentive();
				await getIncentive();
				refreshTotalStaked();
				refreshRewards();
				refreshReward();
				wflag = 0
			} catch(err) {
				console.log(err)
				toast.push('Unstake Failed')
			} finally {
				wflag = 0;
			}
		})
	}

	async function withdraw(_tokenId) {
		wflag = _tokenId + 2;
		let strc = StakingRewardContract().connect($selectedProvider.getSigner());
		try {
			let res = await strc.withdrawToken(_tokenId, address, []);
			await res.wait()
			status[_tokenId] = "";
			toast.push('Finished withdrawing')
		} catch(err) {
			toast.push('Withdraw Failed')
		} finally {
			wflag = 0;
		}
	}

	let _total_staked_promise = null;
	async function getTokenIds(index) {
		// StakingRewardContract
		const tokenId = await nftManagerPositionsContract().tokenOfOwnerByIndex(
			Staking_reward_address,
			index
		)
		return tokenId
	}

	async function getStakedAmount(tokenId) {

	}

	const sleep = (milliseconds) => {
	  return new Promise(resolve => setTimeout(resolve, milliseconds))
	}

	let amount = {};
	let rate_ = 1;
	async function refreshTotalStaked() {
		try {
			fetches = {};
			balance = (await nftManagerPositionsContract().balanceOf(Staking_reward_address)).toNumber();
			const indexes = [];
			for (let i = beginningTokenId; i < balance; i++) {
				indexes.push(i)
			}
			_total_staked_promise = Promise.all((indexes).map(getTokenIds)).then(async (_tokenIds) => {
				let initial = toBigNumber(0);
				let rw = toBigNumber(0);
				let APR = "0";
				let promises = {}
				for (let _tokenId of _tokenIds) {
					promises[_tokenId] = nftManagerPositionsContract().positions(_tokenId)
				}

				price = await getPrice()
				getStatus();
				let objs = {}
				for (let _tokenId of _tokenIds) {
					const obj = NFTOracle().getPrice(_tokenId, sqrtPriceX96)
					objs[_tokenId] = obj
				}

				for (let _tokenId of _tokenIds) {
					const obj = await objs[_tokenId]
					amount[_tokenId] = (toBigNumber(obj[0])/toBigNumber(1000000)+((toBigNumber(obj[1])*toBigNumber(await price))/toBigNumber(10**WrappedThunderPOKTPolygonMainnetDecimals))).toFixed(2)

					initial = sumOfBigNumber([initial, amount[_tokenId]]);
				}
				rw = toBigNumber(wtPOKTDailyReward);
				APR = toBigNumber(toFixed(rw*price, initial, 2)).multipliedBy(36500).toFixed(2);
				return [initial, APR]
			})
			console.log(_total_staked_promise)
		} catch(err) {
			console.log(err)
		} finally {
			console.log(_total_staked_promise)

		}
	}

	async function getStatus() {
		await axios
		.post("https://api.thegraph.com/subgraphs/name/dragondmoney/wtpokt_staking", {"query":"query MyQuery {\n  positions(orderDirection: desc, where: {state_not: \"\"}) {\n    tokenId\n    state\n    approved\n    staked\n    owner\n    oldOwner\n    timestamp\n  }\n}","variables":null,"operationName":"MyQuery","extensions":{"headers":null}})
		.then(res => {
			states = res.data.data.positions;
		});
		states.map(state => {
			stakedTokenTime[state.tokenId] = state.timestamp;
		})
	}

	// index where the script should begin checking for uni NFT's

	let incentive = {
		rewardToken: wtPOKTPolygonMainnetAddress,
		pool: wtPOKTUSDCPoolAddress,
		wtAmount: Number,
		startTime: Number || NaN,
		endTime: Number || NaN,
		refundee: "",
	}
	async function onSubmit(e) {
		incentive = {
			rewardToken: wtPOKTPolygonMainnetAddress,
			pool: wtPOKTUSDCPoolAddress,
			wtAmount: incentive.wtAmount,
			startTime: Number(startTime)/1000,
			endTime: Number(endTime)/1000,
			refundee: incentive.refundee,
		}
		axios
		.post("https://api.thunderpokt.fi" + "/thunderpokt/savePokt", incentive)
		.then(res => {
			toast.push('Successfully Saved')
			getLatestIncentive();
			getIncentive();
		})
	}

	refreshTotalStaked();

</script>

<style>
	:global(.animated) {
		transition: all 0.2s ease-in-out;
	}

	:global(.min-w-56) {
		max-width: 14rem;
	}
	:global(.scale-null) {
  	transform: scale(0);
	}
	:global(.scale-full) {
		transform: scale(1);
	}
	:global(.top-full) {
		top: 100%;
	}
</style>

<svelte:head>
	<title>ThunderPOKT | Stake</title>
	<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/flatpickr/dist/flatpickr.min.css">
	<link rel="stylesheet" type="text/css" href="https://npmcdn.com/flatpickr/dist/themes/material_green.css">
</svelte:head>

<main class="container m-auto mb-0 flex-grow flex flex-col items-center justify-center">
	<h2 class="text-3xl text-center mt-10">Liquidity Mining</h2>
	<div class="stake p-8 mt-10 md:p-10 lg:mt-10">
		<div class="px-4 sm:grid sm:grid-cols-3 sm:gap-20">
			{#if _total_staked_promise === null}
				<span class="text-gray-500"><Loading /> Loading...</span>

			{:else}
				{#await _total_staked_promise}
					<span class="text-gray-500"><Loading /> Loading...</span>

				{:then totalStaked}
					<div>
						<h3 class="font-black text-2xl text-center">{totalStaked[1]}%</h3>
						<div class="text-center">
							<span class="text-gray-400 font-bold align-middle">APR</span>
							<button
								class="inline-flex align-middle relative"
								use:tooltip={{text: tooltipContent, paddingClass: 'p-0 pb-4', background: 'bg-white'}}>
								<img
									class="inline p-1 h-6 rounded-l-md"
									src="/img/questionMark.svg"
									alt="questionMark"
								/>
							</button>
							<span bind:this={tooltipContent} class="hidden text-gray-500 cursor-auto rounded-xl overflow-hidden pointer-events-auto min-w-56 flex-col relative items-center w-full">
								<span class="relative text-sm text-left px-3 text-gray-600 font-bold mt-2 mb-1 z-10">
									APR will change depending on how much is staked and the price of wtPOKT.
								</span>
							</span>
						</div>
					</div>
					<div>
						<h3 class="font-black text-2xl text-center">{wtPOKTDailyReward} wtPOKT</h3>
						<p class="text-center text-gray-400 font-bold">REWARDS/DAY</p>
					</div>
					<div>
						<h3 class="font-black text-2xl text-center">${totalStaked[0]}</h3>
						<p class="text-center text-gray-400 font-bold">TOTAL STAKED</p>
					</div>
				{:catch err}
					<div class="w-full sm:col-span-3 text-center">Failed to fetch total Staked</div>
					<script>
					console.log({err})
					</script>
				{/await}
			{/if}
		</div>
	</div>
	<div class="stake mb-10">

		{#if curr_page == 1}
			<!-- Step 1. Wallet and Mint Amount -->
			<div>
				{#if $accounts.length === 0}
					<div class="pb-40">
						<h3 class="text-2xl text-center mb-10 pt-10 pb-5">No Wallet Connected</h3>
						<p class="mb-5">Please connect a wallet to mint.</p>
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
					<div>
						{#await _rewards_promise}
							<span class="text-gray-500"><Loading /> Loading...</span>

						{:then rewards}
							<h3 class="font-bold text-xl text-left mb-5">You have { rewards.length } wtPOKT-USDC liquidity positions</h3>
							<div>
								<p class="font-bold text-base text-left mb-5">Get more by providing liquidity <a class="text-blue-600" href="https://docs.thunderpokt.fi/welcome-to-tpokt-by-thunderfi/liquidity-provision/how-to">here</a></p>
							</div>
							<div class="px-4 mb-2">
								<div>
									<div class="grid grid-cols-4 gap-3 items-center">
										<p class="font-xs text-gray-400 col-span-2">Incentive:</p>
										<p class="font-xs text-gray-400 col-span-2">Total Rewards:</p>
									</div>
									<div class="grid grid-cols-4 gap-3 items-center">
										{#await _reward_promise}
											<div class="col-span-4 text-center">
												<span class="text-gray-500"><Loading /> Loading...</span>
											</div>
										{:then _reward}
											<select class="bg-transparent h-fit col-span-2 text-xs p-0 appearance-none border-none">
												<option>
												{ formatTimestamp(latestIncentive.startTime) } - { formatTimestamp(latestIncentive.endTime) }
												</option>
											</select>
											<div>
												<span class="font-bold mr-2">
													{' '}{formatUnits(_reward, WrappedThunderPOKTPolygonMainnetDecimals, 3)}{' '}wtPOKT
												</span>
											</div>
											<div>
												<button
													disabled={isClaiming || _reward.isZero()}
													class={`bg-yellow-400 px-6 py-2 font-bold rounded-md text-sm ${(isClaiming || _reward.isZero()) ? "bg-yellow-600" : ""}`}
													on:click={() => claimHandler()}
												>
												{#if isClaiming}
													Claiming  <Loading />
												{:else}
													Claim
												{/if}
												</button>
											</div>
										{:catch error}
											<div class="col-span-4 text-center">
												Failed to get reward info
											</div>
										{/await}
									</div>
								</div>
							</div>
							<div>
								<div class="grid grid-cols-5 text-sm font-bold gap-2">
									<span col-span-1>ID</span>
									<span col-span-1>Pooled Amount</span>
									<span col-span-1>Rewards</span>
								</div>
								{#each rewards as reward, i (i)}
									<div class="text-sm overflow-hidden grid grid-cols-5 font-bold border-t-2 py-2 sm:gap-2 gap-1 items-center">
										<span
											class="col-span-1 cursor-pointer"
											on:click={() => {
												window.open(`https://revert.finance/#/uniswap-position/polygon/${reward.tokenId}`, '_blank')
											}}
										>
											{ reward.tokenId }
										</span>
										<span class="col-span-1">${ amount[reward.tokenId] ? amount[reward.tokenId] : 0 }</span>
										{#if (status[reward.tokenId] === "Staked") && (latestIncentive.startTime > stakedTokenTime[reward.tokenId])}
											<span class="col-span-1 text-xs text-red-900">Incentive finished. Please restake in the new incentive</span>
										{:else}
											<span class="col-span-1">{ toBigNumber(formatUnits(reward.reward, WrappedThunderPOKTPolygonMainnetDecimals, 3)).toFixed(3) }</span>
										{/if}
										<button
											class={`px-2 py-2 font-bold rounded-md text-sm ${(status[reward.tokenId] === "Staked" || ((latestIncentive.endTime*1000) < (new Date().getTime())) == true) || ((new Date().getTime()) < (latestIncentive.startTime*1000)) == true ? "bg-yellow-600" : "bg-yellow-400"}`}
											disabled={status[reward.tokenId] === "Staked" || ((latestIncentive.endTime*1000) < (new Date().getTime())) == true || ((new Date().getTime()) < (latestIncentive.startTime*1000)) == true}
											on:click={() => {
												if(status[reward.tokenId] === "Approved") {
													transfer(reward.tokenId);
												} else if(status[reward.tokenId] === "Deposited") {
													stake(reward.tokenId);
												} else {
													approve(reward.tokenId);
												}
											}}
										>
											{#if flag === (reward.tokenId + 1) && status[reward.tokenId] != "Approved"}
												Approving  <Loading />
											{:else if status[reward.tokenId] === "Approved" && flag != (reward.tokenId + 2)}
												Deposit
											{:else if status[reward.tokenId] === "Deposited" && flag != (reward.tokenId + 3)}
												Stake
											{:else if status[reward.tokenId] === "Staked"}
												Staked
											{:else if flag === (reward.tokenId + 2) && status[reward.tokenId] === "Approved"}
												Transfering  <Loading />
											{:else if flag === (reward.tokenId + 3) && status[reward.tokenId] === "Deposited"}
												Staking  <Loading />
											{:else}
												Approve
											{/if}
										</button>
										<button
											class={`px-2 py-2 font-bold rounded-md text-sm ${status[reward.tokenId] != "Deposited" && status[reward.tokenId] != "Staked"  ? "bg-yellow-600" : "bg-yellow-400"}`}
											disabled={status[reward.tokenId] != "Deposited" && status[reward.tokenId] != "Staked"}
											on:click={() => {
												if (status[reward.tokenId] === "Staked") {
														unstake(reward.tokenId, stakedTokenTime[reward.tokenId])
												} else {
														withdraw(reward.tokenId)
												}
											}}
										>
											{#if (status[reward.tokenId] === "Staked") && (latestIncentive.startTime > stakedTokenTime[reward.tokenId]) && wflag == 0}
												Unstake from Old Incentives
											{:else if (status[reward.tokenId] === "Staked") && (latestIncentive.startTime < stakedTokenTime[reward.tokenId]) && wflag == 0}
												Unstake
											{:else if status[reward.tokenId] === "Deposited" && wflag === 0}
												Withdraw
											{:else if wflag === (reward.tokenId + 1)}
												Unstaking  <Loading />
											{:else if wflag === (reward.tokenId + 2)}
												Withdrawing  <Loading />
											{:else}
												Unstaked
											{/if}
										</button>
									</div>
								{/each}
								{#if rewards.length == 0}
								<div>No Reward List</div>
								{/if}
							</div>
						<!-- {:catch error}
							<h3 class="font-bold text-xl text-left mb-5">Failed to get wtPOKT-USDC liquidity positions, {error}</h3> -->
						{/await}
					</div>
				{/if}
			</div>
		{/if}
	</div>
	{#if $selectedChain == PolygonNetworkVersion}
		{#if equalAddress("0xC35F97C23c41C144fDF8445089179E29b3d60ed6", $accounts[0]) || equalAddress("0x64550bDBD9808Fb9E44E099ad460CBBAf65862E5", $accounts[0]) || equalAddress("0xc829D80c4494f21851a122cBd4f6dFBFDB175929", $accounts[0]) || equalAddress("0x981403254307eFFbABCC45860E8e2191b58138Be", $accounts[0])}
			<div class="stake mb-10">
				<span class="font-bold text-xl text-left mb-6">Admin Panel</span>
				<form  on:submit|preventDefault={onSubmit}>
					<div class="flex justify-between flex-wrap">
						<div>
							<span class="text-gray-500">Start</span>
							<Flatpickr options="{ startTimeOptions }" bind:value={startDate} element="#start-picker" bind:startpickr>
								<div class="mb-5 w-64 ">
								<div class="flatpickr relative" id="start-picker">
								  <input type="text" placeholder="Select Date.." data-input class="w-full pl-4 pr-10 py-3 leading-none rounded-lg shadow-sm
									focus:outline-none focus:shadow-outline text-gray-600 font-medium">
										<div class="absolute top-0 right-0 px-3 py-2">
									<svg on:click={() => { if (startpickr) { startpickr.open(); }}}
									  class="h-6 w-6 text-gray-400"
									  fill="none"
									  viewBox="0 0 24 24"
									  stroke="currentColor"
									>
									  <path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0
										00-2 2v12a2 2 0 002 2z"
									  />
									</svg>
										</div>
									</div>
							  </div>
							</Flatpickr>
						</div>
						<div>
							<span class="text-gray-500">End</span>
							<Flatpickr options="{ endTimeOptions }" bind:value={endDate} element="#end-picker" bind:endpickr>
								<div class="mb-5 w-64 ">
								<div class="flatpickr relative" id="end-picker">
								  <input type="text" placeholder="Select Date.." data-input class="w-full pl-4 pr-10 py-3 leading-none rounded-lg shadow-sm
									focus:outline-none focus:shadow-outline text-gray-600 font-medium">
										<div class="absolute top-0 right-0 px-3 py-2">
									<svg on:click={() => { if (endpickr) { endpickr.open(); }}}
									  class="h-6 w-6 text-gray-400"
									  fill="none"
									  viewBox="0 0 24 24"
									  stroke="currentColor"
									>
									  <path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0
										00-2 2v12a2 2 0 002 2z"
									  />
									</svg>
										</div>
									</div>
							  </div>
							</Flatpickr>
						</div>
					</div>
					<input class="shadow appearance-none border rounded w-full py-2 px-3 mb-6 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" id="wpAmount" type="number" placeholder="Reward wtPokt Amount" bind:value={incentive.wtAmount}>
					<input class="shadow appearance-none border rounded w-full py-2 px-3 mb-6 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" id="refundee" type="text" placeholder="Refundee Address" bind:value={incentive.refundee}>
					<button
						class="w-full mb-6 px-4 py-2 font-bold text-white bg-blue-500 rounded-full hover:bg-blue-700 focus:outline-none focus:shadow-outline"
						type="submit"
					>
						Save Incentive to Database
					</button>
				</form>
				<div>
					<button
						class="w-full mb-6 px-4 py-2 font-bold text-white bg-blue-500 rounded-full hover:bg-blue-700 focus:outline-none focus:shadow-outline"
						on:click={approveToken}
					>
						Approve to stake contract
					</button>
					<button
						class="w-full mb-6 px-4 py-2 font-bold text-white bg-blue-500 rounded-full hover:bg-blue-700 focus:outline-none focus:shadow-outline"
						on:click={createIncentive}
					>
						Create Incentive
					</button>
				</div>
			</div>
		{/if}
	{/if}
	<SvelteToast {options} />
</main>
