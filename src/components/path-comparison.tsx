"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { PathCard } from "@/components/path-card";
import { fetchDepth } from "@/lib/order-book";
import { pathChainKey } from "@/types/path";
import type { Network, Path, RateChange } from "@/types/path";

interface Props {
  paths: Path[];
  network: Network;
  limit?: number;
  /** Per-route rate movement since the last live-poll fetch, keyed by pathChainKey. */
  rateChanges?: Map<string, RateChange>;
  usdPrices?: Record<string, number>;
}

export function PathComparison({
  paths,
  network,
  limit = 3,
  rateChanges,
}: Props) {
  const top = useMemo(() => {
    return [...paths]
      .sort((a, b) => Number(b.rate) - Number(a.rate))
      .slice(0, limit);
  }, [paths, limit]);

  // Map of pathChainKey -> depth ratio (0–1).
  const [depthRatios, setDepthRatios] = useState<Map<string, number>>(
    () => new Map(),
  );

  // Track which set of paths we last fetched depths for, so a new search
  // clears the stale bars immediately rather than flashing old data.
  const lastTopKeysRef = useRef<string>("");

  useEffect(() => {
    if (top.length < 2) return;

    const topKeys = top.map((p) => pathChainKey(p)).join("|");

    // Reset stale depth bars when the top-three set changes.
    if (topKeys !== lastTopKeysRef.current) {
      lastTopKeysRef.current = topKeys;
      setDepthRatios(new Map());
    }

    let cancelled = false;

    const fetchAll = async () => {
      const results = await Promise.allSettled(
        top.map((path) => {
          // The first hop asset pair: source -> hops[0] (or destination for direct).
          const buying =
            path.hops.length > 0 ? path.hops[0] : path.destination;
          return fetchDepth(network, path.source, buying);
        }),
      );

      if (cancelled) return;

      const depths = results.map((r) =>
        r.status === "fulfilled" ? r.value : 0,
      );
      const maxDepth = Math.max(...depths, 0);

      const next = new Map<string, number>();
      for (let i = 0; i < top.length; i++) {
        const ratio = maxDepth > 0 ? depths[i] / maxDepth : 0;
        next.set(pathChainKey(top[i]), ratio);
      }

      setDepthRatios(next);
    };

    void fetchAll();
    return () => {
      cancelled = true;
    };
  }, [top, network]);

  if (top.length < 2) return null;

  return (
    <section className="space-y-3">
      <div className="flex items-baseline justify-between">
        <h3 className="text-xs font-medium uppercase tracking-wider text-slate-500">
          Top {top.length} route{top.length === 1 ? "" : "s"} by rate
        </h3>
        <p className="text-xs text-slate-600">Side-by-side comparison</p>
      </div>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
        {top.map((path, i) => (
          <PathCard
            key={i}
            path={path}
            rank={i + 1}
            rateChange={rateChanges?.get(pathChainKey(path))}
            depthRatio={depthRatios.get(pathChainKey(path))}
          />
        ))}
      </div>
    </section>
  );
}
