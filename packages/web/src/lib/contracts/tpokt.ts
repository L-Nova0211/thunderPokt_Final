import {
	ThunderPOKTPolygonMainnetAddress,
	ThunderPOKTPolygonMainnetDecimals,
	ThunderPOKTPolygonRPCProvider
} from '$lib/constants';
import { ethers, type ContractInterface } from 'ethers';
import tPOKT from 'hardhat-app/artifacts/contracts/tPOKT.sol/tPokt.json';

export function tpoktContract() {
	let provider = new ethers.providers.JsonRpcProvider(ThunderPOKTPolygonRPCProvider);
	const tpokt = new ethers.Contract(ThunderPOKTPolygonMainnetAddress, tPOKT.abi, provider);
	window.tpokt = tpokt;
	return tpokt;
}

export function addThunderPoktToWallet() {
	return window.ethereum.request({
		method: 'wallet_watchAsset',
		params: {
			type: 'ERC20',
			options: {
				address: ThunderPOKTPolygonMainnetAddress, // The address of the token contract
				symbol: 'tPOKT', // A ticker symbol or shorthand, up to 5 characters
				decimals: ThunderPOKTPolygonMainnetDecimals, // The number of token decimals
				image: `${window.location.protocol}//${window.location.host}/img/tpokt.png`
			}
		}
	});
}
