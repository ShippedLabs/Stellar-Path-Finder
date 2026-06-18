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
  /**
   * Run a search initiated by the user.
   * The caller (page.tsx) is responsible for pushing the URL history entry
   * before calling this so we keep a clean separation of concerns.
   */
  search: (input: FindPathsInput) => Promise<void>;
  /**
   * Run a background re-fetch (e.g. polling).  Identical to `search` but
   * signals to the caller that no new history entry should be pushed.
   */
  refresh: (input: FindPathsInput) => Promise<void>;
  reset: () => void;
}

function describeError(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === "string") return err;
  return "Unable to fetch paths";
}

async function runSearch(
  input: FindPathsInput,
  id: number,
  requestId: React.MutableRefObject<number>,
  setLoading: (v: boolean) => void,
  setError: (v: string | null) => void,
  setHasSearched: (v: boolean) => void,
  setLastInput: (v: FindPathsInput) => void,
  setPaths: (v: Path[]) => void,
) {
  setLoading(true);
  setError(null);
  setHasSearched(true);
  setLastInput(input);
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
}

export function usePaths(): UsePathsResult {
  const [paths, setPaths] = useState<Path[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [lastInput, setLastInput] = useState<FindPathsInput | null>(null);
  const requestId = useRef(0);

  const search = useCallback(async (input: FindPathsInput) => {
    const id = ++requestId.current;
    await runSearch(
      input,
      id,
      requestId,
      setLoading,
      setError,
      setHasSearched,
      setLastInput,
      setPaths,
    );
  }, []);

  /**
   * Background refresh — same logic as search but the caller knows not to
   * push a new history entry.  Stale request cancellation still applies.
   */
  const refresh = useCallback(async (input: FindPathsInput) => {
    const id = ++requestId.current;
    await runSearch(
      input,
      id,
      requestId,
      setLoading,
      setError,
      setHasSearched,
      setLastInput,
      setPaths,
    );
  }, []);

  const reset = useCallback(() => {
    requestId.current += 1;
    setPaths([]);
    setError(null);
    setLoading(false);
    setHasSearched(false);
    setLastInput(null);
  }, []);

  return { paths, loading, error, hasSearched, lastInput, search, refresh, reset };
}
