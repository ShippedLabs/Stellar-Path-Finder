"use client";

import { useCallback, useRef, useState } from "react";
import { attachHopRates, findPaths } from "@/lib/path-finder";
import type { FindPathsInput, Path } from "@/types/path";

interface UsePathsResult {
  paths: Path[];
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

export function usePaths(): UsePathsResult {
  const [paths, setPaths] = useState<Path[]>([]);
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
    setError(null);
    setLoading(false);
    setHasSearched(false);
    setLastInput(null);
    lastInputRef.current = null;
  }, []);

  return { paths, loading, error, hasSearched, lastInput, search, refetch, reset };
}
