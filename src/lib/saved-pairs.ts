"use client";

import { assetKey } from "@/types/path";
import type { FindPathsInput, Network } from "@/types/path";

export interface SavedPair {
  network: Network;
  source: FindPathsInput["source"];
  destination: FindPathsInput["destination"];
  amount: string;
  direction: FindPathsInput["direction"];
}

const STORAGE_KEY = "saved-pairs";

function getSavedPairs(): SavedPair[] {
  if (typeof window === "undefined") return [];
  try {
    const json = localStorage.getItem(STORAGE_KEY);
    return json ? JSON.parse(json) : [];
  } catch {
    return [];
  }
}

function setSavedPairs(pairs: SavedPair[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(pairs));
  } catch {
    // Silently fail if localStorage is unavailable
  }
}

/**
 * Load all saved pairs for a specific network.
 */
export function loadSavedPairs(network: Network): SavedPair[] {
  const allPairs = getSavedPairs();
  return allPairs.filter((pair) => pair.network === network);
}

/**
 * Save a pair, avoiding duplicates based on source, destination, amount, and direction.
 */
export function savePair(input: FindPathsInput): SavedPair {
  const newPair: SavedPair = {
    network: input.network,
    source: input.source,
    destination: input.destination,
    amount: input.amount,
    direction: input.direction,
  };

  const allPairs = getSavedPairs();

  // Check if this pair already exists
  const isDuplicate = allPairs.some(
    (pair) =>
      pair.network === newPair.network &&
      assetKey(pair.source) === assetKey(newPair.source) &&
      assetKey(pair.destination) === assetKey(newPair.destination) &&
      pair.amount === newPair.amount &&
      pair.direction === newPair.direction,
  );

  if (!isDuplicate) {
    allPairs.push(newPair);
    setSavedPairs(allPairs);
  }

  return newPair;
}

/**
 * Remove a pair from saved pairs by its index.
 */
export function removePair(network: Network, index: number): void {
  const allPairs = getSavedPairs();
  const networkPairs = allPairs.filter((pair) => pair.network === network);

  if (index >= 0 && index < networkPairs.length) {
    // Find the absolute index in the full list
    let count = 0;
    const absoluteIndex = allPairs.findIndex((pair) => {
      if (pair.network === network) {
        if (count === index) return true;
        count++;
      }
      return false;
    });

    if (absoluteIndex >= 0) {
      allPairs.splice(absoluteIndex, 1);
      setSavedPairs(allPairs);
    }
  }
}

/**
 * Generate a readable label for a pair (e.g., "XLM -> USDC").
 */
export function getPairLabel(pair: SavedPair): string {
  const sourceCode = pair.source.type === "native" ? "XLM" : pair.source.code;
  const destCode =
    pair.destination.type === "native" ? "XLM" : pair.destination.code;
  return `${sourceCode} → ${destCode}`;
}
