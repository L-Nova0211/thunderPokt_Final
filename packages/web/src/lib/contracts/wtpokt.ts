import {
	ThunderPOKTPolygonRPCProvider,
	WrappedThunderPOKTPolygonMainnetDecimals,
	wtPOKTPolygonMainnetAddress
} from '$lib/constants';
import { ethers } from 'ethers';
import WtPOKT from 'hardhat-app/artifacts/contracts/wtPOKT.sol/WtPOKT.json';

export function wtpoktContract() {
	let provider = new ethers.providers.JsonRpcProvider(ThunderPOKTPolygonRPCProvider);
	const wtpokt = new ethers.Contract(wtPOKTPolygonMainnetAddress, WtPOKT.abi, provider);
	window.wtpokt = wtpokt;
	return wtpokt;
}

export function addWrappedThunderPoktToWallet() {
	return window.ethereum.request({
		method: 'wallet_watchAsset',
		params: {
			type: 'ERC20',
			options: {
				address: wtPOKTPolygonMainnetAddress, // The address of the token contract
				symbol: 'wtPOKT', // A ticker symbol or shorthand, up to 5 characters
				decimals: WrappedThunderPOKTPolygonMainnetDecimals, // The number of token decimals
				image: `${window.location.protocol}//${window.location.host}/img/wtpokt.svg`
			}
		}
	});
}
