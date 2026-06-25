import type { AssetRef, FindPathsInput, Path } from "@/types/path";

/** Base URL for the Soroswap aggregator REST API. */
const SOROSWAP_API = "https://api.soroswap.finance";

/**
 * Soroswap uses "native" for XLM and a contract address string for tokens.
 * We represent XLM internally as { type: "native", code: "XLM" } and issued
 * assets as { type: "credit_alphanum4/12", code, issuer }.
 */
function assetToSoroswapId(ref: AssetRef): string {
  if (ref.type === "native") return "native";
  // Soroswap identifies assets by their classic asset string "CODE:ISSUER".
  return `${ref.code}:${ref.issuer ?? ""}`;
}

interface SoroswapToken {
  contract?: string;
  code?: string;
  issuer?: string;
  name?: string;
}

interface SoroswapRoute {
  path: SoroswapToken[];
  /** Amount in the smallest unit (stroops for XLM, base units for tokens). */
  amount_in: string;
  amount_out: string;
}

interface SoroswapResponse {
  routes?: SoroswapRoute[];
}

function tokenToAssetRef(token: SoroswapToken): AssetRef {
  // Native XLM has no issuer / contract.
  if (!token.issuer && !token.code) {
    return { type: "native", code: "XLM" };
  }
  const code = token.code ?? "";
  return {
    type: code.length <= 4 ? "credit_alphanum4" : "credit_alphanum12",
    code,
    issuer: token.issuer,
  };
}

function computeRate(sourceAmount: string, destinationAmount: string): string {
  const src = Number(sourceAmount);
  const dst = Number(destinationAmount);
  if (!Number.isFinite(src) || !Number.isFinite(dst) || src === 0) return "0";
  return (dst / src).toFixed(7);
}

function normalizeRoute(
  route: SoroswapRoute,
  input: FindPathsInput,
): Path {
  const allAssets = route.path.map(tokenToAssetRef);

  // Soroswap returns the full path including source & destination.
  // The "hops" in our model are the intermediate assets only.
  const source = allAssets[0] ?? input.source;
  const destination = allAssets[allAssets.length - 1] ?? input.destination;
  const hops = allAssets.slice(1, -1);

  // Soroswap returns raw stroop/base-unit integers. Convert to decimal strings
  // with 7 decimal places (Stellar's standard precision).
  const srcAmount = (Number(route.amount_in) / 1e7).toFixed(7);
  const dstAmount = (Number(route.amount_out) / 1e7).toFixed(7);

  return {
    source,
    destination,
    sourceAmount: srcAmount,
    destinationAmount: dstAmount,
    hops,
    rate: computeRate(srcAmount, dstAmount),
    routeSource: "soroban",
  };
}

/**
 * Fetches available Soroban-DEX routes from the Soroswap aggregator for the
 * given input parameters.
 *
 * Only runs on mainnet — Soroswap does not have a testnet deployment.
 * Returns an empty array on testnet so callers can always await this safely.
 *
 * Network and API errors propagate to the caller so they can be handled with
 * Promise.allSettled without silently swallowing them.
 */
export async function fetchSorobanPaths(
  input: FindPathsInput,
): Promise<Path[]> {
  // Soroswap is mainnet only — return empty on testnet immediately.
  if (input.network !== "mainnet") return [];

  const fromId = assetToSoroswapId(input.source);
  const toId = assetToSoroswapId(input.destination);

  // Convert the user-facing decimal amount to stroops (7 decimal places).
  const amountInStroops = Math.round(Number(input.amount) * 1e7).toString();

  const url = new URL(`${SOROSWAP_API}/aggregator/v1/route`);
  url.searchParams.set("from", fromId);
  url.searchParams.set("to", toId);
  url.searchParams.set("amount", amountInStroops);
  url.searchParams.set("type", input.direction === "strict-send" ? "exact_in" : "exact_out");

  const res = await fetch(url.toString(), {
    headers: { Accept: "application/json" },
    // Timeout after 8 seconds so a slow Soroban API doesn't delay the UI.
    signal: AbortSignal.timeout(8_000),
  });

  if (!res.ok) {
    throw new Error(`Soroswap API error: ${res.status} ${res.statusText}`);
  }

  const data = (await res.json()) as SoroswapResponse;
  const routes = data.routes ?? [];

  return routes.map((r) => normalizeRoute(r, input));
}
