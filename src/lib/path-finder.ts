import { Asset } from "@stellar/stellar-sdk";
import { getHorizonServer } from "@/lib/horizon-client";
import type {
  AssetRef,
  AssetType,
  FindPathsInput,
  Path,
} from "@/types/path";

interface HorizonAssetFields {
  asset_type: string;
  asset_code?: string;
  asset_issuer?: string;
}

interface HorizonPathRecord {
  source_asset_type: string;
  source_asset_code?: string;
  source_asset_issuer?: string;
  source_amount: string;
  destination_asset_type: string;
  destination_asset_code?: string;
  destination_asset_issuer?: string;
  destination_amount: string;
  path: HorizonAssetFields[];
}

export function toSdkAsset(ref: AssetRef): Asset {
  if (ref.type === "native") return Asset.native();
  if (!ref.issuer) {
    throw new Error(`Asset ${ref.code} requires an issuer`);
  }
  return new Asset(ref.code, ref.issuer);
}

function fromHorizonAsset(fields: HorizonAssetFields): AssetRef {
  if (fields.asset_type === "native") {
    return { type: "native", code: "XLM" };
  }
  return {
    type: fields.asset_type as AssetType,
    code: fields.asset_code ?? "",
    issuer: fields.asset_issuer,
  };
}

function computeRate(sourceAmount: string, destinationAmount: string): string {
  const src = Number(sourceAmount);
  const dst = Number(destinationAmount);
  if (!Number.isFinite(src) || !Number.isFinite(dst) || src === 0) return "0";
  return (dst / src).toFixed(7);
}

function normalize(record: HorizonPathRecord): Path {
  const source = fromHorizonAsset({
    asset_type: record.source_asset_type,
    asset_code: record.source_asset_code,
    asset_issuer: record.source_asset_issuer,
  });
  const destination = fromHorizonAsset({
    asset_type: record.destination_asset_type,
    asset_code: record.destination_asset_code,
    asset_issuer: record.destination_asset_issuer,
  });
  return {
    source,
    destination,
    sourceAmount: record.source_amount,
    destinationAmount: record.destination_amount,
    hops: record.path.map(fromHorizonAsset),
    rate: computeRate(record.source_amount, record.destination_amount),
  };
}

export async function findPaths(input: FindPathsInput): Promise<Path[]> {
  const server = getHorizonServer(input.network);
  const source = toSdkAsset(input.source);
  const destination = toSdkAsset(input.destination);

  const builder =
    input.direction === "strict-send"
      ? server.strictSendPaths(source, input.amount, [destination])
      : server.strictReceivePaths([source], destination, input.amount);

  const page = await builder.call();
  const records = page.records as unknown as HorizonPathRecord[];
  return records.map(normalize);
}
