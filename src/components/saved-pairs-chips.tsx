"use client";

import { useEffect, useState } from "react";
import {
  loadSavedPairs,
  removePair,
  getPairLabel,
  type SavedPair,
} from "@/lib/saved-pairs";
import type { FindPathsInput, Network } from "@/types/path";

interface Props {
  network: Network;
  onSelectPair: (input: FindPathsInput) => void;
}

export function SavedPairsChips({ network, onSelectPair }: Props) {
  const [pairs, setPairs] = useState<SavedPair[]>([]);

  // Load saved pairs for the current network
  useEffect(() => {
    setPairs(loadSavedPairs(network));
  }, [network]);

  const handleRemove = (index: number) => {
    removePair(network, index);
    setPairs((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSelect = (pair: SavedPair) => {
    onSelectPair({
      network: pair.network,
      source: pair.source,
      destination: pair.destination,
      amount: pair.amount,
      direction: pair.direction,
    });
  };

  if (pairs.length === 0) {
    return null;
  }

  return (
    <div className="mb-6 space-y-2">
      <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
        Saved pairs
      </p>
      <div className="flex flex-wrap gap-2">
        {pairs.map((pair, index) => (
          <button
            key={index}
            onClick={() => handleSelect(pair)}
            className="group inline-flex items-center gap-2 rounded-full bg-emerald-500/15 px-3 py-2 text-xs font-medium text-emerald-300 transition-colors hover:bg-emerald-500/25 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-slate-900"
          >
            <span>{getPairLabel(pair)}</span>
            <span className="text-slate-400">{pair.amount}</span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleRemove(index);
              }}
              className="ml-1 inline-flex h-4 w-4 items-center justify-center rounded-full transition-colors hover:bg-emerald-500/50 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2 focus:ring-offset-slate-900"
              aria-label={`Remove ${getPairLabel(pair)}`}
            >
              <svg
                className="h-3 w-3"
                fill="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path d="M6.4 18L5 16.6 10.6 11 5 5.4 6.4 4 12 9.6 17.6 4 19 5.4 13.4 11 19 16.6 17.6 18 12 12.4 6.4 18z" />
              </svg>
            </button>
          </button>
        ))}
      </div>
    </div>
  );
}
