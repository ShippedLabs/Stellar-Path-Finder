import { horizonUrl } from "@/lib/horizon-client";
import type { Network } from "@/types/path";

export type HorizonHealth = "ok" | "degraded";

const HORIZON_HEALTH_TIMEOUT_MS = 3_000;

export async function checkHorizonHealth(network: Network): Promise<HorizonHealth> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), HORIZON_HEALTH_TIMEOUT_MS);

  try {
    const response = await fetch(horizonUrl(network), {
      method: "GET",
      signal: controller.signal,
      cache: "no-store",
    });
    return response.ok ? "ok" : "degraded";
  } catch {
    return "degraded";
  } finally {
    clearTimeout(timeout);
  }
}
