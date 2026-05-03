"use client";

import { useCallback, useRef, useState } from "react";
import { findPaths } from "@/lib/path-finder";
import type { FindPathsInput, Path } from "@/types/path";

interface UsePathsResult {
  paths: Path[];
  loading: boolean;
  error: string | null;
  hasSearched: boolean;
  lastInput: FindPathsInput | null;
  search: (input: FindPathsInput) => Promise<void>;
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

  const search = useCallback(async (input: FindPathsInput) => {
    const id = ++requestId.current;
    setLoading(true);
    setError(null);
    setHasSearched(true);
    setLastInput(input);
    try {
      const results = await findPaths(input);
      if (id !== requestId.current) return;
      setPaths(results);
    } catch (err) {
      if (id !== requestId.current) return;
      setError(describeError(err));
      setPaths([]);
    } finally {
      if (id === requestId.current) setLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    requestId.current += 1;
    setPaths([]);
    setError(null);
    setLoading(false);
    setHasSearched(false);
    setLastInput(null);
  }, []);

  return { paths, loading, error, hasSearched, lastInput, search, reset };
}
