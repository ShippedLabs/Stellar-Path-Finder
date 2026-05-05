import type { AssetRef, Network } from "@/types/path";

const STORAGE_KEY = "spf:customAssets";

export type CustomAssetMap = Record<Network, AssetRef[]>;

export const EMPTY_CUSTOM_ASSETS: CustomAssetMap = {
  mainnet: [],
  testnet: [],
};

function isAssetRef(value: unknown): value is AssetRef {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  if (
    v.type !== "native" &&
    v.type !== "credit_alphanum4" &&
    v.type !== "credit_alphanum12"
  ) {
    return false;
  }
  if (typeof v.code !== "string") return false;
  if (v.type !== "native" && typeof v.issuer !== "string") return false;
  return true;
}

function sanitize(list: unknown): AssetRef[] {
  if (!Array.isArray(list)) return [];
  return list.filter(isAssetRef);
}

export function loadCustomAssets(): CustomAssetMap {
  if (typeof window === "undefined") return EMPTY_CUSTOM_ASSETS;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY_CUSTOM_ASSETS;
    const parsed = JSON.parse(raw) as Partial<CustomAssetMap> | null;
    return {
      mainnet: sanitize(parsed?.mainnet),
      testnet: sanitize(parsed?.testnet),
    };
  } catch {
    return EMPTY_CUSTOM_ASSETS;
  }
}

export function saveCustomAssets(value: CustomAssetMap): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
  } catch {}
}
