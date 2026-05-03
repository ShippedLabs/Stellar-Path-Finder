"use client";

import { useEffect, useState } from "react";
import { AssetSelector } from "@/components/asset-selector";
import { NetworkToggle } from "@/components/network-toggle";
import { useNetwork } from "@/hooks/use-network";
import { knownAssets } from "@/lib/asset-registry";
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

  useEffect(() => {
    const list = knownAssets(network);
    setSource(list[0]);
    setDestination(list[1] ?? list[0]);
  }, [network]);

  const sameAsset = assetKey(source) === assetKey(destination);
  const numericAmount = Number(amount);
  const validAmount = Number.isFinite(numericAmount) && numericAmount > 0;
  const canSubmit = !sameAsset && validAmount && !loading;

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!canSubmit) return;
    onSubmit({ network, direction, source, destination, amount });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-lg font-medium text-slate-100">Find a route</h2>
        <NetworkToggle />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <AssetSelector
          id="source-asset"
          label="From"
          network={network}
          value={source}
          onChange={setSource}
        />
        <AssetSelector
          id="destination-asset"
          label="To"
          network={network}
          value={destination}
          onChange={setDestination}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="amount"
          className="text-xs font-medium uppercase tracking-wider text-slate-400"
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
          className="rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-slate-100 placeholder-slate-600 transition-colors focus:border-emerald-500 focus:outline-none"
        />
      </div>

      <fieldset className="space-y-2">
        <legend className="text-xs font-medium uppercase tracking-wider text-slate-400">
          Direction
        </legend>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {DIRECTIONS.map((option) => {
            const checked = direction === option.value;
            return (
              <label
                key={option.value}
                className={
                  "flex cursor-pointer flex-col gap-0.5 rounded-lg border px-3 py-2.5 transition-colors " +
                  (checked
                    ? "border-emerald-500 bg-emerald-500/5"
                    : "border-slate-800 bg-slate-900 hover:border-slate-700")
                }
              >
                <input
                  type="radio"
                  name="direction"
                  value={option.value}
                  checked={checked}
                  onChange={() => setDirection(option.value)}
                  className="sr-only"
                />
                <span className="text-sm font-medium text-slate-100">
                  {option.label}
                </span>
                <span className="text-xs text-slate-500">{option.hint}</span>
              </label>
            );
          })}
        </div>
      </fieldset>

      {sameAsset ? (
        <p className="text-xs text-amber-400">
          Source and destination assets must differ.
        </p>
      ) : null}

      <button
        type="submit"
        disabled={!canSubmit}
        className="w-full rounded-lg bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-slate-950 transition-colors hover:bg-emerald-400 disabled:cursor-not-allowed disabled:bg-slate-800 disabled:text-slate-500"
      >
        {loading ? "Searching…" : "Find paths"}
      </button>
    </form>
  );
}
