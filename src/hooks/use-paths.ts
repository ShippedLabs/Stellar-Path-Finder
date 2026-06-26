"use client";

import { useCallback, useRef, useState } from "react";
import { attachHopRates, findPaths } from "@/lib/path-finder";
import { fetchUsdPrice } from "@/lib/usd-price";
import { assetKey } from "@/types/path";
import type { AssetRef, FindPathsInput, Path } from "@/types/path";

interface UsePathsResult {
  paths: Path[];
  usdPrices: Record<string, number>;
  loading: boolean;
  error: string | null;
  hasSearched: boolean;
  lastInput: FindPathsInput | null;
  search: (input: FindPathsInput) => Promise<void>;
  refetch: () => Promise<void>;
  reset: () => void;
}

function describeError(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === "string") return err;
  return "Unable to fetch paths";
}

// Session cache to store fetched prices during the duration of the session
const priceCache = new Map<string, number>();

export function usePaths(): UsePathsResult {
  const [paths, setPaths] = useState<Path[]>([]);
  const [usdPrices, setUsdPrices] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [lastInput, setLastInput] = useState<FindPathsInput | null>(null);
  const requestId = useRef(0);
  // Mirrors lastInput so refetch can re-run the latest search without being
  // recreated on every input change (keeps the polling callback stable).
  const lastInputRef = useRef<FindPathsInput | null>(null);

  const search = useCallback(async (input: FindPathsInput) => {
    const id = ++requestId.current;
    setLoading(true);
    setError(null);
    setHasSearched(true);
    setLastInput(input);
    lastInputRef.current = input;
    try {
      const results = await findPaths(input);
      if (id !== requestId.current) return;
      setPaths(results);

      // Fetch USD prices for unique assets in parallel
      if (input.network === "mainnet") {
        const uniqueAssets = new Map<string, AssetRef>();
        for (const path of results) {
          uniqueAssets.set(assetKey(path.source), path.source);
          uniqueAssets.set(assetKey(path.destination), path.destination);
        }

        const keysToFetch = Array.from(uniqueAssets.keys());
        const fetchPromises = keysToFetch.map(async (key) => {
          if (priceCache.has(key)) {
            return { key, price: priceCache.get(key)! };
          }
          const asset = uniqueAssets.get(key)!;
          const price = await fetchUsdPrice(input.network, asset);
          if (price !== null) {
            priceCache.set(key, price);
          }
          return { key, price };
        });

        Promise.all(fetchPromises)
          .then((resolved) => {
            if (id !== requestId.current) return;
            const newPrices: Record<string, number> = {};
            for (const item of resolved) {
              if (item.price !== null && item.price !== undefined) {
                newPrices[item.key] = item.price;
              }
            }
            setUsdPrices((prev) => ({ ...prev, ...newPrices }));
          })
          .catch(() => {
            // Skip price fetch silently on failure
          });
      }

      // Enrich with per-hop rates in the background so the initial results
      // render immediately. A late or failed enrichment leaves base paths intact.
      void attachHopRates(input.network, results)
        .then((enriched) => {
          if (id === requestId.current) setPaths(enriched);
        })
        .catch(() => {
          /* keep paths without hop rates */
        });
    } catch (err) {
      if (id !== requestId.current) return;
      setError(describeError(err));
      setPaths([]);
    } finally {
      if (id === requestId.current) setLoading(false);
    }
  }, []);

  // Re-run the most recent search. Goes through `search`, so it shares the same
  // requestId race-condition guard as a manual search.
  const refetch = useCallback(() => {
    const input = lastInputRef.current;
    if (!input) return Promise.resolve();
    return search(input);
  }, [search]);

  const reset = useCallback(() => {
    requestId.current += 1;
    setPaths([]);
    setUsdPrices({});
    setError(null);
    setLoading(false);
    setHasSearched(false);
    setLastInput(null);
    lastInputRef.current = null;
  }, []);

  return { paths, usdPrices, loading, error, hasSearched, lastInput, search, refetch, reset };
}

