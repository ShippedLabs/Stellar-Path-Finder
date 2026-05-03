"use client";

import { knownAssets } from "@/lib/asset-registry";
import { assetKey } from "@/types/path";
import type { AssetRef, Network } from "@/types/path";

interface Props {
  id: string;
  label: string;
  network: Network;
  value: AssetRef;
  onChange: (asset: AssetRef) => void;
}

function shortIssuer(issuer: string): string {
  return `${issuer.slice(0, 4)}…${issuer.slice(-4)}`;
}

function optionLabel(asset: AssetRef): string {
  if (asset.type === "native") return "XLM · native";
  return asset.issuer
    ? `${asset.code} · ${shortIssuer(asset.issuer)}`
    : asset.code;
}

export function AssetSelector({ id, label, network, value, onChange }: Props) {
  const assets = knownAssets(network);
  const selectedKey = assetKey(value);

  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={id}
        className="text-xs font-medium uppercase tracking-wider text-slate-400"
      >
        {label}
      </label>
      <select
        id={id}
        value={selectedKey}
        onChange={(event) => {
          const next = assets.find((asset) => assetKey(asset) === event.target.value);
          if (next) onChange(next);
        }}
        className="rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-slate-100 transition-colors focus:border-emerald-500 focus:outline-none"
      >
        {assets.map((asset) => (
          <option key={assetKey(asset)} value={assetKey(asset)}>
            {optionLabel(asset)}
          </option>
        ))}
      </select>
    </div>
  );
}
