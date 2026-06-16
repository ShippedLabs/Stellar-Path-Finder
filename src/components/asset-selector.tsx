"use client";

import { useState } from "react";
import { StrKey } from "@stellar/stellar-sdk";
import { knownAssets } from "@/lib/asset-registry";
import { assetKey } from "@/types/path";
import type { AssetRef, AssetType, Network } from "@/types/path";

interface Props {
  id: string;
  label: string;
  network: Network;
  value: AssetRef;
  onChange: (asset: AssetRef) => void;
  customAssets?: AssetRef[];
  onAddCustom?: (asset: AssetRef) => void;
}

const CODE_PATTERN = /^[A-Za-z0-9]{1,12}$/;

function shortIssuer(issuer: string): string {
  return `${issuer.slice(0, 4)}…${issuer.slice(-4)}`;
}

function optionLabel(asset: AssetRef): string {
  if (asset.type === "native") return "XLM · native";
  return asset.issuer
    ? `${asset.code} · ${shortIssuer(asset.issuer)}`
    : asset.code;
}

function deriveAssetType(code: string): AssetType {
  return code.length <= 4 ? "credit_alphanum4" : "credit_alphanum12";
}

export function AssetSelector({
  id,
  label,
  network,
  value,
  onChange,
  customAssets = [],
  onAddCustom,
}: Props) {
  const [showForm, setShowForm] = useState(false);
  const [customCode, setCustomCode] = useState("");
  const [customIssuer, setCustomIssuer] = useState("");
  const [error, setError] = useState<string | null>(null);

  const assets = [...knownAssets(network), ...customAssets];
  const selectedKey = assetKey(value);
  
  // Accessibility: Create dynamic IDs for form inputs and error
  const codeInputId = `${id}-custom-code`;
  const issuerInputId = `${id}-custom-issuer`;
  const errorId = `${id}-custom-error`;

  const resetForm = () => {
    setShowForm(false);
    setCustomCode("");
    setCustomIssuer("");
    setError(null);
  };

  const handleAdd = () => {
    const code = customCode.trim().toUpperCase();
    const issuer = customIssuer.trim();

    if (!CODE_PATTERN.test(code)) {
      setError("Code must be 1–12 letters or digits.");
      return;
    }
    if (!StrKey.isValidEd25519PublicKey(issuer)) {
      setError("Issuer must be a valid Stellar account starting with G.");
      return;
    }

    const newAsset: AssetRef = {
      type: deriveAssetType(code),
      code,
      issuer,
    };
    const newKey = assetKey(newAsset);
    const existing = assets.find((asset) => assetKey(asset) === newKey);

    if (existing) {
      onChange(existing);
    } else {
      onAddCustom?.(newAsset);
      onChange(newAsset);
    }
    resetForm();
  };

  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={id}
        className="text-sm font-semibold uppercase tracking-wider text-slate-300"
      >
        {label}
      </label>
      <select
        id={id}
        value={selectedKey}
        onChange={(event) => {
          const next = assets.find(
            (asset) => assetKey(asset) === event.target.value,
          );
          if (next) onChange(next);
        }}
        className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 transition-colors focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
      >
        {assets.map((asset) => (
          <option key={assetKey(asset)} value={assetKey(asset)}>
            {optionLabel(asset)}
          </option>
        ))}
      </select>

      {onAddCustom && !showForm ? (
        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="self-start text-sm font-medium text-emerald-400 transition-colors hover:text-emerald-300 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2 focus:ring-offset-slate-900 rounded-sm"
        >
          + Add custom asset
        </button>
      ) : null}

      {onAddCustom && showForm ? (
        <div className="mt-1 space-y-3 rounded-lg border border-slate-700 bg-slate-950 p-4">
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="flex-1 flex flex-col gap-1">
              <label htmlFor={codeInputId} className="sr-only">Custom Asset Code</label>
              <input
                id={codeInputId}
                type="text"
                value={customCode}
                onChange={(event) => setCustomCode(event.target.value)}
                placeholder="Code (e.g. NGNT)"
                maxLength={12}
                // Accessibility: Associate error and indicate invalid state
                aria-invalid={!!error}
                aria-describedby={error ? errorId : undefined}
                className="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 placeholder-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div className="flex-[2] flex flex-col gap-1">
              <label htmlFor={issuerInputId} className="sr-only">Custom Asset Issuer</label>
              <input
                id={issuerInputId}
                type="text"
                value={customIssuer}
                onChange={(event) => setCustomIssuer(event.target.value)}
                placeholder="Issuer (G…)"
                spellCheck={false}
                autoCapitalize="off"
                aria-invalid={!!error}
                aria-describedby={error ? errorId : undefined}
                className="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 font-mono text-sm text-slate-100 placeholder-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>
          {/* Accessibility: Render error with matching ID */}
          {error ? (
            <p id={errorId} className="text-sm font-medium text-rose-300" aria-live="assertive">
              {error}
            </p>
          ) : null}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleAdd}
              className="rounded-md bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950 transition-colors hover:bg-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-slate-950"
            >
              Add
            </button>
            <button
              type="button"
              onClick={resetForm}
              className="rounded-md px-4 py-2 text-sm font-medium text-slate-300 transition-colors hover:text-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 focus:ring-offset-slate-950"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
