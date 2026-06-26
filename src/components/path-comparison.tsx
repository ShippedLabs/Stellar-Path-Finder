"use client";

import { useMemo } from "react";
import { PathCard } from "@/components/path-card";
import { pathChainKey } from "@/types/path";
import type { Path, RateChange } from "@/types/path";

interface Props {
  paths: Path[];
  limit?: number;
  /** Per-route rate movement since the last live-poll fetch, keyed by pathChainKey. */
  rateChanges?: Map<string, RateChange>;
  usdPrices?: Record<string, number>;
}

export function PathComparison({ paths, limit = 3, rateChanges, usdPrices }: Props) {
  const top = useMemo(() => {
    return [...paths]
      .sort((a, b) => Number(b.rate) - Number(a.rate))
      .slice(0, limit);
  }, [paths, limit]);

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
            usdPrices={usdPrices}
          />
        ))}
      </div>
    </section>
  );
}
