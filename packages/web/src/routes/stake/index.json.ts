import { api } from './_api';
import * as ethers from 'ethers';
import type { RequestHandler } from '@sveltejs/kit';
import SushiswapRouterAbi from '@sushiswap/core/build/abi/IUniswapV2Router02.json';
import {
	SushiswapRouter,
	ThunderPOKTPolygonMainnetAddress,
	ThunderPOKTPolygonMainnetDecimals,
	ThunderPOKTPolygonRPCProvider,
	USDCPolygonMainnetAddress,
	USDCPolygonMainnetDecimals
} from '$lib/constants';

export const get: RequestHandler = async () => {
	const sushiRouter = new ethers.Contract(
		SushiswapRouter,
		SushiswapRouterAbi,
		new ethers.providers.JsonRpcProvider(ThunderPOKTPolygonRPCProvider)
	);
	const pokt_price_promise = api('get', `simple/price?ids=pocket-network&vs_currencies=usd`)
		.then(async (resp) => {
			if (resp.status === 200) {
				const price = await resp.json();
				if (price['pocket-network']?.usd) {
					return price['pocket-network']?.usd;
				}
			}
			console.log('Failed to find POKT price from coingecko', resp.url);
			return { error: `Failed to find POKT price from CoinGecko. Tried ${resp.url}` };
		})
		.catch((error) => error);
	const tpokt_price_promise = sushiRouter
		.getAmountsOut(ethers.utils.parseUnits('1', ThunderPOKTPolygonMainnetDecimals), [
			ThunderPOKTPolygonMainnetAddress,
			USDCPolygonMainnetAddress
		])
		.then(([_, usdc_amount]) =>
			Number(ethers.utils.formatUnits(usdc_amount, USDCPolygonMainnetDecimals))
		);
	const [pokt_price, tpokt_price] = await Promise.all([pokt_price_promise, tpokt_price_promise]);

	console.log('Fetched price info', { pokt_price, tpokt_price });

	if (pokt_price && pokt_price.error) {
		return {
			body: {
				pokt_price_error: pokt_price.error,
				tpokt_price_error: null,
				pokt_price: null,
				tpokt_price: null
			}
		};
	}

	if (tpokt_price && tpokt_price.error) {
		return {
			body: {
				pokt_price_error: null,
				tpokt_price_error: tpokt_price.error,
				pokt_price: null,
				tpokt_price: null
			}
		};
	}

	return {
		body: {
			pokt_price: pokt_price,
			tpokt_price: tpokt_price
		}
	};
};
