import { horizonUrl } from "@/lib/horizon-client";
import type { Network } from "@/types/path";

export type NetworkHealthStatus = "ok" | "degraded";

export const HORIZON_HEALTH_TIMEOUT_MS = 3000;

export interface CheckHorizonHealthOptions {
  timeoutMs?: number;
  fetchFn?: typeof fetch;
}

/**
 * Checks the health of Stellar Horizon by making a lightweight GET request
 * to its root endpoint. Returns "ok" if the response arrives within 3 seconds
 * and has a successful status code, or "degraded" otherwise.
 */
export async function checkHorizonHealth(
  network: Network,
  options?: CheckHorizonHealthOptions,
): Promise<NetworkHealthStatus> {
  const timeoutMs = options?.timeoutMs ?? HORIZON_HEALTH_TIMEOUT_MS;
  const fetchImpl =
    options?.fetchFn ?? (typeof fetch !== "undefined" ? fetch : undefined);

  if (!fetchImpl) {
    return "degraded";
  }

  const controller = new AbortController();
  const timer = setTimeout(() => {
    controller.abort();
  }, timeoutMs);

  try {
    const url = horizonUrl(network);
    const response = await fetchImpl(url, {
      method: "GET",
      signal: controller.signal,
      headers: {
        Accept: "application/json",
      },
    });

    clearTimeout(timer);

    if (!response.ok) {
      return "degraded";
    }

    return "ok";
  } catch (_error) {
    clearTimeout(timer);
    return "degraded";
  }
}
