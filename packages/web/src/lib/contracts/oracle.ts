import {
	NFT_Oracle,
    StakingRewardAddressPolygonRPCProvider
} from '$lib/constants';
import { ethers, type ContractInterface } from 'ethers';

export const abi = [{"inputs":[{"internalType":"address","name":"_positionManager","type":"address"}],"stateMutability":"nonpayable","type":"constructor"},{"inputs":[{"internalType":"uint256","name":"tokenId","type":"uint256"},{"internalType":"uint160","name":"sqrtPriceX96","type":"uint160"}],"name":"getPrice","outputs":[{"internalType":"uint256","name":"","type":"uint256"},{"internalType":"uint256","name":"","type":"uint256"},{"internalType":"address","name":"","type":"address"},{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"priceA","type":"uint256"},{"internalType":"uint256","name":"priceB","type":"uint256"}],"name":"getSqrtPriceX96","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"pure","type":"function"},{"inputs":[{"internalType":"uint160","name":"sqrtPriceX96","type":"uint160"}],"name":"getTick","outputs":[{"internalType":"int24","name":"tick","type":"int24"}],"stateMutability":"pure","type":"function"},{"inputs":[],"name":"positionManager","outputs":[{"internalType":"contract INonfungiblePositionManager","name":"","type":"address"}],"stateMutability":"view","type":"function"}]

export function NFTOracle() {
	let provider = new ethers.providers.JsonRpcProvider(StakingRewardAddressPolygonRPCProvider);
	const oracle = new ethers.Contract(NFT_Oracle, abi, provider);
	return oracle;
}
