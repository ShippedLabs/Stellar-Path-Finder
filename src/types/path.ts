export type Network = "testnet" | "mainnet";

export type Direction = "strict-send" | "strict-receive";

export type AssetType = "native" | "credit_alphanum4" | "credit_alphanum12";

export interface AssetRef {
  type: AssetType;
  code: string;
  issuer?: string;
}

export interface Path {
  source: AssetRef;
  destination: AssetRef;
  sourceAmount: string;
  destinationAmount: string;
  hops: AssetRef[];
  rate: string;
  /**
   * Mid-price for each consecutive hop in the route
   * (source -> hop1, ..., hopN -> destination). Populated asynchronously
   * after the path search completes; "N/A" marks a hop whose order book
   * could not be fetched. Optional so existing callers remain unaffected.
   */
  hopRates?: string[];
}

export interface FindPathsInput {
  network: Network;
  direction: Direction;
  source: AssetRef;
  destination: AssetRef;
  amount: string;
}

/**
 * Direction a path's rate has moved between two live-polling fetches.
 * `undefined` (no prop) means "not tracking" and renders no indicator.
 */
export type RateChange = "up" | "down" | "same";

export function assetKey(asset: AssetRef): string {
  return asset.type === "native" ? "native" : `${asset.code}:${asset.issuer ?? ""}`;
}

/**
 * Stable identity for a route based purely on its asset chain
 * (source -> hops -> destination), independent of amounts or rate. Used to
 * match the same route across live-polling fetches so rate changes can be
 * compared. Amounts are intentionally excluded because they fluctuate with
 * the order book on every re-fetch.
 */
export function pathChainKey(path: Path): string {
  return [
    assetKey(path.source),
    ...path.hops.map(assetKey),
    assetKey(path.destination),
  ].join(">");
}

export function assetLabel(asset: AssetRef): string {
  return asset.type === "native" ? "XLM" : asset.code;
}
