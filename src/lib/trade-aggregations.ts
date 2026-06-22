import { horizonUrl } from "@/lib/horizon-client";
import type { AssetRef, Network, RateHistoryPoint } from "@/types/path";

interface TradeAggregationRecord {
  timestamp: string | number;
  close: string;
}

interface TradeAggregationResponse {
  _embedded?: {
    records?: TradeAggregationRecord[];
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
  if (asset.issuer) params.set(`${prefix}_asset_issuer`, asset.issuer);
}

export async function fetchRateHistory(
  network: Network,
  selling: AssetRef,
  buying: AssetRef,
  resolution: number,
): Promise<RateHistoryPoint[]> {
  const endTime = Date.now();
  const startTime = endTime - 30 * 24 * 60 * 60 * 1000;
  const params = new URLSearchParams({
    start_time: String(startTime),
    end_time: String(endTime),
    resolution: String(resolution),
    order: "asc",
    limit: "200",
  });

  appendAssetParams(params, "base", selling);
  appendAssetParams(params, "counter", buying);

  const response = await fetch(
    `${horizonUrl(network)}/trade_aggregations?${params.toString()}`,
  );
  if (!response.ok) {
    throw new Error("Unable to fetch historical rates");
  }

  const data = (await response.json()) as TradeAggregationResponse;
  const records = data._embedded?.records ?? [];

  return records
    .map((record) => ({
      timestamp: Number(record.timestamp),
      close: record.close,
    }))
    .filter(
      (point) =>
        Number.isFinite(point.timestamp) && Number.isFinite(Number(point.close)),
    );
}
