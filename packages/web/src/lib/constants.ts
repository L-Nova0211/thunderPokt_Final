import { ethers } from 'ethers';
import { toBigNumber, formatUnits, sumOfBigNumber, toFixed } from '$lib/utils/big-number';
export const TelegramUrl = 'https://t.me/thundercove';

export const SushiUrl =
	import.meta.env.VITE_SUSHISWAP_URL ||
	'https://app.sushi.com/swap?inputCurrency=0x2791bca1f2de4661ed88a30c99a7a9449aa84174&outputCurrency=0x5430a0B6C11f870571ffA891d59dec8C4608Ea9A';

export const DocsUrl = 'https://thunderpokt.gitbook.io/welcome-to-tpokt-by-thunderfi/';

export const ThunderStakeUrl = 'https://thunderstake.io';

export const MintFeeAmount = 0.01;

export const PolygonNetworkVersion = import.meta.env.VITE_POLYGON_CHAIN_ID;

export const ThunderPOKTWalletAddress = '478d17c58cce93a2d046083423d30accdb32d6a7';

export const ThunderPOKTPolygonMainnetAddress = '0x5430a0B6C11f870571ffA891d59dec8C4608Ea9A';

export const wtPOKTPolygonMainnetAddress = '0x301595f6fd5f69faD7a488DaCB8971e7c0C2f559'
if (!wtPOKTPolygonMainnetAddress || !ethers.utils.isAddress(wtPOKTPolygonMainnetAddress)) {
	throw new Error('Invalid environment variable: VITE_WTPOKT_CONTRACT_ADDR');
}

export const ThunderPOKTPolygonMainnetDecimals = 6;
export const WrappedThunderPOKTPolygonMainnetDecimals = 12;

export const USDCPolygonMainnetDecimals = 6;

export const ThunderPOKTPolygonRPCProvider = import.meta.env
	.VITE_POLYGON_JSON_RPC_PROVIDER as string;

export const SushiswapRouter = '0x1b02dA8Cb0d097eB8D57A175b88c7D8b47997506';

export const USDCPolygonMainnetAddress = '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174';

export const CoinGeckoPOKTUrl = 'https://www.coingecko.com/en/coins/pocket-network';

export const NftManagerPositionsPolygonRPCProvider = import.meta.env
.VITE_POLYGON_JSON_RPC_PROVIDER as string;
export const NftManagerPositionsAddress = '0xC36442b4a4522E871399CD717aBDD847Ab11FE88';

export const StakingRewardAddressPolygonRPCProvider = import.meta.env
.VITE_POLYGON_JSON_RPC_PROVIDER as string;
export const Staking_reward_address = "0x80b7859967d0e40A0cB87560EA120DCB93c56230"

// LP Token
export const SLP_wtpokt_usdc = "0xe65ad051E96C1f7fCC8572AEA9f4F1D883B8a852";

// Incentive Info
export const wtPOKTUSDCPoolAddress = "0x3cc6f5d3cbe52ecf15ccb43d0832ad4f6ef132cf";
export const currentIncentiveKey = {
	rewardToken: ThunderPOKTPolygonMainnetAddress,
	pool: wtPOKTUSDCPoolAddress,
	startTime: Number("1650901800"), // Apr 19, 2022 new Date( "2022-04-19 20:45:00" ).getTime()
	endTime: Number("1650903600"),	// Apr 19, 2022
	refundee: "0xC35F97C23c41C144fDF8445089179E29b3d60ed6",
}

export const incentiveAmount = 8000;

const stakingPeriod = Number((currentIncentiveKey["endTime"] - currentIncentiveKey["startTime"])/86400);

export const tPOKTDailyReward = Math.floor(incentiveAmount/stakingPeriod);

export const LpDecimals = 8

export const NFT_Oracle = "0xeb62Fb34A74f7536aE2f5458a8fc9e57240384B5";
