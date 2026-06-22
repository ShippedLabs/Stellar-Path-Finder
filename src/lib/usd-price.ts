import { horizonUrl } from "@/lib/horizon-client";
import { assetKey } from "@/types/path";
import type { AssetRef, Network, Path } from "@/types/path";

export type UsdPriceCache = Map<string, number | null>;

const MAINNET_USDC: AssetRef = {
  type: "credit_alphanum4",
  code: "USDC",
  issuer: "GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN",
};

const ONE_HOUR_MS = 60 * 60 * 1000;

interface TradeAggregationResponse {
  _embedded?: {
    records?: {
      close?: string;
    }[];
  };
}

function appendAssetParams(
  params: URLSearchParams,
  prefix: "base" | "counter",
  asset: AssetRef,
) {
  params.set(`${prefix}_asset_type`, asset.type);
  if (asset.type === "native") return;
  params.set(`${prefix}_asset_code`, asset.code);
  params.set(`${prefix}_asset_issuer`, asset.issuer ?? "");
}

export async function fetchUsdPrice(
  network: Network,
  asset: AssetRef,
): Promise<number> {
  if (network !== "mainnet") {
    throw new Error("USD prices are only available on mainnet");
  }
  if (assetKey(asset) === assetKey(MAINNET_USDC)) return 1;

  const params = new URLSearchParams({
    resolution: String(ONE_HOUR_MS),
    order: "desc",
    limit: "1",
  });
  appendAssetParams(params, "base", asset);
  appendAssetParams(params, "counter", MAINNET_USDC);

  const response = await fetch(
    `${horizonUrl(network)}/trade_aggregations?${params.toString()}`,
  );
  if (!response.ok) {
    throw new Error(`Unable to fetch USD price for ${assetKey(asset)}`);
  }

  const data = (await response.json()) as TradeAggregationResponse;
  const close = data._embedded?.records?.[0]?.close;
  const price = Number(close);
  if (!Number.isFinite(price)) {
    throw new Error(`No USD price available for ${assetKey(asset)}`);
  }
  return price;
}

function uniquePathAssets(paths: Path[]): AssetRef[] {
  const seen = new Set<string>();
  const assets: AssetRef[] = [];

  for (const path of paths) {
    for (const asset of [path.source, path.destination, ...path.hops]) {
      const key = assetKey(asset);
      if (seen.has(key)) continue;
      seen.add(key);
      assets.push(asset);
    }
  }

  return assets;
}

export async function fetchUsdPricesForPaths(
  network: Network,
  paths: Path[],
  cache: UsdPriceCache,
): Promise<Record<string, number>> {
  if (network !== "mainnet" || paths.length === 0) return {};

  const assets = uniquePathAssets(paths);
  await Promise.all(
    assets.map(async (asset) => {
      const key = assetKey(asset);
      if (cache.has(key)) return;
      try {
        cache.set(key, await fetchUsdPrice(network, asset));
      } catch {
        cache.set(key, null);
      }
    }),
  );

  const prices: Record<string, number> = {};
  for (const asset of assets) {
    const key = assetKey(asset);
    const price = cache.get(key);
    if (typeof price === "number") prices[key] = price;
  }
  return prices;
}
