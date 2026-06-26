import { Asset } from "@stellar/stellar-sdk";
import { getHorizonServer } from "@/lib/horizon-client";
import type { AssetRef, Network } from "@/types/path";

const NO_PRICE = "N/A";

function toSdkAsset(ref: AssetRef): Asset {
  if (ref.type === "native") return Asset.native();
  if (!ref.issuer) {
    throw new Error(`Asset ${ref.code} requires an issuer`);
  }
  return new Asset(ref.code, ref.issuer);
}

/**
 * Fetches the SDEX order book for the `selling -> buying` pair and returns its
 * mid-price (the average of the best bid and best ask) as a string. The price
 * is expressed in units of `buying` per unit of `selling`, matching the
 * direction of the hop.
 *
 * Returns "N/A" when the order book has no bids or asks. Network/SDK errors are
 * intentionally left to propagate so callers can decide how to degrade.
 */
export async function fetchMidPrice(
  network: Network,
  selling: AssetRef,
  buying: AssetRef,
): Promise<string> {
  const server = getHorizonServer(network);
  const book = await server
    .orderbook(toSdkAsset(selling), toSdkAsset(buying))
    .call();

  const bestBid = book.bids[0]?.price;
  const bestAsk = book.asks[0]?.price;
  if (bestBid === undefined || bestAsk === undefined) return NO_PRICE;

  const bid = Number(bestBid);
  const ask = Number(bestAsk);
  if (!Number.isFinite(bid) || !Number.isFinite(ask)) return NO_PRICE;

  return ((bid + ask) / 2).toFixed(7);
}

/**
 * Fetches the SDEX order book for the `selling -> buying` pair and returns the
 * total available volume on the ask side summed across the top `levels` price
 * levels. This gives a coarse measure of how much liquidity is available to
 * fill the first hop of a route at the best prices.
 *
 * Returns `0` when the order book has no asks. Network/SDK errors are
 * intentionally left to propagate so callers can decide how to degrade.
 *
 * @param levels - Maximum number of ask levels to sum (default: 10)
 */
export async function fetchDepth(
  network: Network,
  selling: AssetRef,
  buying: AssetRef,
  levels = 10,
): Promise<number> {
  const server = getHorizonServer(network);
  const book = await server
    .orderbook(toSdkAsset(selling), toSdkAsset(buying))
    .limit(levels)
    .call();

  const asks = book.asks.slice(0, levels);
  if (asks.length === 0) return 0;

  return asks.reduce((sum, level) => {
    const amount = Number(level.amount);
    return sum + (Number.isFinite(amount) ? amount : 0);
  }, 0);
}
