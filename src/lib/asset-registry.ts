import type { AssetRef, Network } from "@/types/path";

export const XLM: AssetRef = { type: "native", code: "XLM" };

const MAINNET_ASSETS: AssetRef[] = [
  XLM,
  {
    type: "credit_alphanum4",
    code: "USDC",
    issuer: "GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN",
  },
  {
    type: "credit_alphanum4",
    code: "yXLM",
    issuer: "GARDNV3Q7YGT4AKSDF25LT32YSCCW4EV22Y2TV3I2PU2MMXJTEDL5T55",
  },
  {
    type: "credit_alphanum4",
    code: "AQUA",
    issuer: "GBNZILSTVQZ4R7IKQDGHYGY2QXL5QOFJYQMXPKWRRM5PAV7Y4M67AQUA",
  },
  {
    type: "credit_alphanum4",
    code: "EURC",
    issuer: "GAP5LETOV6YIE62YAM56STDANPRDO7ZFDBGSNHJQIYGGKSMOZAHOOS2S",
  },
];

const TESTNET_ASSETS: AssetRef[] = [
  XLM,
  {
    type: "credit_alphanum4",
    code: "USDC",
    issuer: "GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5",
  },
  {
    type: "credit_alphanum4",
    code: "SRT",
    issuer: "GCDNJUBQSX7AJWLJACMJ7I4BC3Z47BQUTMHEICZLE6MU4KQBRYG5JY6B",
  },
];

export function knownAssets(network: Network): AssetRef[] {
  return network === "mainnet" ? MAINNET_ASSETS : TESTNET_ASSETS;
}

export function findAsset(
  network: Network,
  code: string,
  issuer?: string,
): AssetRef | undefined {
  const list = knownAssets(network);
  if (code === "XLM" && !issuer) return XLM;
  return list.find(
    (asset) =>
      asset.code === code &&
      (asset.issuer ?? undefined) === (issuer ?? undefined),
  );
}
