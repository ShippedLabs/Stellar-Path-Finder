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
}

export interface FindPathsInput {
  network: Network;
  direction: Direction;
  source: AssetRef;
  destination: AssetRef;
  amount: string;
}

export function assetKey(asset: AssetRef): string {
  return asset.type === "native" ? "native" : `${asset.code}:${asset.issuer ?? ""}`;
}

export function assetLabel(asset: AssetRef): string {
  return asset.type === "native" ? "XLM" : asset.code;
}
