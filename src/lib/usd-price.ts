import { assetKey } from "@/types/path";
import type { AssetRef, Network } from "@/types/path";
import { horizonUrl } from "@/lib/horizon-client";

// USDC details on mainnet
const MAINNET_USDC: AssetRef = {
  type: "credit_alphanum4",
  code: "USDC",
  issuer: "GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN",
};

/**
 * Queries Horizon's /trade_aggregations endpoint for the asset against USDC
 * and returns the most recent close price as a number.
 * Returns null if the fetch fails or no trades exist.
 */
export async function fetchUsdPrice(
  network: Network,
  asset: AssetRef
): Promise<number | null> {
  // Only fetch USD prices on mainnet
  if (network !== "mainnet") {
    return null;
  }

  const key = assetKey(asset);
  const usdcKey = assetKey(MAINNET_USDC);

  // If the asset is USDC itself, its USD value is 1
  if (key === usdcKey) {
    return 1.0;
  }

  const baseUrl = horizonUrl(network);
  const url = new URL(`${baseUrl}/trade_aggregations`);

  // Base asset (the asset we want the price for)
  url.searchParams.set("base_asset_type", asset.type);
  if (asset.type !== "native") {
    url.searchParams.set("base_asset_code", asset.code);
    url.searchParams.set("base_asset_issuer", asset.issuer ?? "");
  }

  // Counter asset (USDC)
  url.searchParams.set("counter_asset_type", MAINNET_USDC.type);
  url.searchParams.set("counter_asset_code", MAINNET_USDC.code);
  url.searchParams.set("counter_asset_issuer", MAINNET_USDC.issuer ?? "");

  // Time window: last 7 days to cover assets with low trade volume.
  // Resolution: 1 hour (3600000 ms)
  const resolution = 3600000;
  const endTime = Date.now();
  const startTime = endTime - 7 * 24 * 60 * 60 * 1000;

  url.searchParams.set("resolution", resolution.toString());
  url.searchParams.set("start_time", startTime.toString());
  url.searchParams.set("end_time", endTime.toString());
  url.searchParams.set("limit", "1");
  url.searchParams.set("order", "desc");

  try {
    const res = await fetch(url.toString(), {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(5000),
    });

    if (!res.ok) {
      return null;
    }

    const data = await res.json();
    const records = data?._embedded?.records;
    if (records && records.length > 0) {
      const closePrice = Number(records[0].close);
      if (Number.isFinite(closePrice)) {
        return closePrice;
      }
    }
    return null;
  } catch (error) {
    return null;
  }
}
