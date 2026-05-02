import { Horizon } from "@stellar/stellar-sdk";
import type { Network } from "@/types/path";

const HORIZON_URLS: Record<Network, string> = {
  testnet: "https://horizon-testnet.stellar.org",
  mainnet: "https://horizon.stellar.org",
};

const cache = new Map<Network, Horizon.Server>();

export function getHorizonServer(network: Network): Horizon.Server {
  const cached = cache.get(network);
  if (cached) return cached;
  const server = new Horizon.Server(HORIZON_URLS[network]);
  cache.set(network, server);
  return server;
}

export function horizonUrl(network: Network): string {
  return HORIZON_URLS[network];
}
