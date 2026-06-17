"use client";

import { useCallback, useEffect, useState } from "react";
import { AssetSelector } from "@/components/asset-selector";
import { NetworkToggle } from "@/components/network-toggle";
import { useNetwork } from "@/hooks/use-network";
import { knownAssets } from "@/lib/asset-registry";
import {
  EMPTY_CUSTOM_ASSETS,
  loadCustomAssets,
  saveCustomAssets,
  type CustomAssetMap,
} from "@/lib/custom-assets";
import { savePair } from "@/lib/saved-pairs";
import { assetKey } from "@/types/path";
import type { AssetRef, Direction, FindPathsInput } from "@/types/path";

interface Props {
  onSubmit: (input: FindPathsInput) => void;
  loading?: boolean;
}

const DIRECTIONS: { value: Direction; label: string; hint: string }[] = [
  {
    value: "strict-send",
    label: "Strict send",
    hint: "Pin the amount you send",
  },
  {
    value: "strict-receive",
    label: "Strict receive",
    hint: "Pin the amount they receive",
  },
];

export function PathForm({ onSubmit, loading = false }: Props) {
  const { network } = useNetwork();
  const initial = knownAssets(network);
  const [source, setSource] = useState<AssetRef>(initial[0]);
  const [destination, setDestination] = useState<AssetRef>(
    initial[1] ?? initial[0],
  );
  const [amount, setAmount] = useState("");
  const [direction, setDirection] = useState<Direction>("strict-send");
  const [customByNetwork, setCustomByNetwork] =
    useState<CustomAssetMap>(EMPTY_CUSTOM_ASSETS);

  const customAssets = customByNetwork[network];
  const [saveNotification, setSaveNotification] = useState<string | null>(null);

  useEffect(() => {
    setCustomByNetwork(loadCustomAssets());
  }, []);

  useEffect(() => {
    const list = knownAssets(network);
    setSource(list[0]);
    setDestination(list[1] ?? list[0]);
  }, [network]);

  const addCustomAsset = useCallback(
    (asset: AssetRef) => {
      setCustomByNetwork((prev) => {
        const list = prev[network];
        const newKey = assetKey(asset);
        if (list.some((existing) => assetKey(existing) === newKey)) {
          return prev;
        }
        const next: CustomAssetMap = {
          ...prev,
          [network]: [...list, asset],
        };
        saveCustomAssets(next);
        return next;
      });
    },
    [network],
  );

  const sameAsset = assetKey(source) === assetKey(destination);
  const numericAmount = Number(amount);
  const validAmount = Number.isFinite(numericAmount) && numericAmount > 0;
  const canSubmit = !sameAsset && validAmount && !loading;

  const handleSavePair = useCallback(() => {
    if (!canSubmit) return;
    savePair({ network, direction, source, destination, amount });
    setSaveNotification("Pair saved!");
    setTimeout(() => setSaveNotification(null), 2000);
  }, [network, direction, source, destination, amount, canSubmit]);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!canSubmit) return;
    onSubmit({ network, direction, source, destination, amount });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-lg font-semibold text-slate-100">Find a route</h2>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleSavePair}
            disabled={!canSubmit}
            title="Save this pair"
            className="relative inline-flex items-center justify-center rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-400 transition-colors hover:border-slate-600 hover:text-slate-300 disabled:cursor-not-allowed disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-slate-900"
          >
            <svg
              className="h-5 w-5"
              fill="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path d="M5 2h14c1.1 0 2 .9 2 2v16l-7-3-7 3V4c0-1.1.9-2 2-2z" />
            </svg>
            {saveNotification && (
              <span className="absolute -top-8 whitespace-nowrap rounded bg-emerald-600 px-2 py-1 text-xs font-medium text-white">
                {saveNotification}
              </span>
            )}
          </button>
          <NetworkToggle />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <AssetSelector
          id="source-asset"
          label="From"
          network={network}
          value={source}
          onChange={setSource}
          customAssets={customAssets}
          onAddCustom={addCustomAsset}
        />
        <AssetSelector
          id="destination-asset"
          label="To"
          network={network}
          value={destination}
          onChange={setDestination}
          customAssets={customAssets}
          onAddCustom={addCustomAsset}
        />
      </div>

      <div className="flex flex-col gap-2">
        <label
          htmlFor="amount"
          className="text-sm font-semibold uppercase tracking-wider text-slate-300"
        >
          {direction === "strict-send" ? "Send amount" : "Receive amount"}
        </label>
        <input
          id="amount"
          type="number"
          inputMode="decimal"
          step="any"
          min="0"
          value={amount}
          onChange={(event) => setAmount(event.target.value)}
          placeholder="0.00"
          // Accessibility: Indicate invalid state when same assets selected
          aria-invalid={sameAsset}
          aria-describedby={sameAsset ? "same-asset-error" : undefined}
          className="rounded-lg border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-slate-100 placeholder-slate-400 transition-colors focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />
        {/* Accessibility: Render error directly associated with input */}
        {sameAsset ? (
          <p
            id="same-asset-error"
            className="text-sm font-medium text-amber-300"
            aria-live="polite"
          >
            Source and destination assets must differ.
          </p>
        ) : null}
      </div>

      <fieldset className="space-y-3">
        <legend className="text-sm font-semibold uppercase tracking-wider text-slate-300">
          Direction
        </legend>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {DIRECTIONS.map((option) => {
            const checked = direction === option.value;
            return (
              <label
                key={option.value}
                className={
                  "flex cursor-pointer flex-col gap-1 rounded-lg border px-4 py-3 transition-colors focus-within:ring-2 focus-within:ring-emerald-500 focus-within:ring-offset-2 focus-within:ring-offset-slate-900 " +
                  (checked
                    ? "border-emerald-500 bg-emerald-500/10"
                    : "border-slate-700 bg-slate-900 hover:border-slate-600")
                }
              >
                <input
                  type="radio"
                  name="direction"
                  value={option.value}
                  checked={checked}
                  onChange={() => setDirection(option.value)}
                  // Accessibility: Keep interactive element available for focus visually hidden
                  className="sr-only"
                />
                <span className="text-sm font-semibold text-slate-100">
                  {option.label}
                </span>
                <span className="text-xs font-medium text-slate-400">
                  {option.hint}
                </span>
              </label>
            );
          })}
        </div>
      </fieldset>

      <button
        type="submit"
        disabled={!canSubmit}
        className="w-full rounded-lg bg-emerald-500 px-4 py-3 text-sm font-bold text-slate-950 transition-colors hover:bg-emerald-400 disabled:cursor-not-allowed disabled:bg-slate-800 disabled:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-slate-900"
      >
        {loading ? "Searching…" : "Find paths"}
      </button>
    </form>
  );
}
