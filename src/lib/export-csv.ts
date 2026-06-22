import { assetLabel } from "@/types/path";
import type { AssetRef, Path } from "@/types/path";

const HEADERS = [
  "Pair",
  "Source Asset",
  "Destination Asset",
  "Send Amount",
  "Receive Amount",
  "Rate",
  "Hops",
  "Hop Assets",
];

function assetCsvLabel(asset: AssetRef): string {
  return asset.type === "native" ? "XLM" : `${asset.code}:${asset.issuer ?? ""}`;
}

function escapeCsvField(value: string | number): string {
  const text = String(value);
  if (!/[",\r\n]/.test(text)) return text;
  return `"${text.replace(/"/g, '""')}"`;
}

function filenamePart(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function buildPathsCsv(paths: Path[]): string {
  const rows = paths.map((path) => {
    const pair = `${assetLabel(path.source)} -> ${assetLabel(path.destination)}`;
    const hopAssets = path.hops.map(assetCsvLabel).join(", ");

    return [
      pair,
      assetCsvLabel(path.source),
      assetCsvLabel(path.destination),
      path.sourceAmount,
      path.destinationAmount,
      path.rate,
      path.hops.length,
      hopAssets,
    ].map(escapeCsvField);
  });

  return [HEADERS, ...rows].map((row) => row.join(",")).join("\r\n");
}

export function buildCsvFilename(paths: Path[], timestamp = Date.now()): string {
  const first = paths[0];
  const pair = first
    ? `${filenamePart(assetLabel(first.source))}-${filenamePart(
        assetLabel(first.destination),
      )}`
    : "paths";

  return `${pair}-${timestamp}.csv`;
}

export function exportPathsAsCsv(paths: Path[]): void {
  if (paths.length === 0) return;

  const csv = buildPathsCsv(paths);
  const link = document.createElement("a");
  link.href = `data:text/csv;charset=utf-8,${encodeURIComponent(`\uFEFF${csv}`)}`;
  link.download = buildCsvFilename(paths);
  link.style.display = "none";

  document.body.appendChild(link);
  link.click();
  link.remove();
}
