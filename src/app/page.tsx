"use client";

import { useEffect, useRef } from "react";
import { PathComparison } from "@/components/path-comparison";
import { PathForm } from "@/components/path-form";
import { PathList } from "@/components/path-list";
import { ResultsSkeleton } from "@/components/results-skeleton";
import { useNetwork } from "@/hooks/use-network";
import { usePaths } from "@/hooks/use-paths";

export default function HomePage() {
  const { network } = useNetwork();
  const { paths, loading, error, hasSearched, search, reset } = usePaths();
  const lastNetwork = useRef(network);

  useEffect(() => {
    if (lastNetwork.current === network) return;
    lastNetwork.current = network;
    reset();
  }, [network, reset]);

  return (
    <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-16">
      <header className="space-y-3">
        <p className="text-xs uppercase tracking-[0.2em] text-emerald-400">
          Stellar · Path Payments
        </p>
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          Stellar Path Finder
        </h1>
        <p className="max-w-2xl text-slate-400">
          Compare path payment routes between any two assets on the Stellar
          network. Pick a source, a destination, and an amount — see every hop,
          every price, and the best rate at a glance.
        </p>
      </header>

      <section className="mt-8 rounded-xl border border-slate-800 bg-slate-900/40 p-5 sm:mt-12 sm:p-8">
        <PathForm onSubmit={search} loading={loading} />
      </section>

      {loading ? (
        <ResultsSkeleton />
      ) : (
        <>
          {error ? (
            <section className="mt-6 rounded-xl border border-rose-800/60 bg-rose-950/30 p-4">
              <p className="text-sm font-medium text-rose-300">Search failed</p>
              <p className="mt-1 text-xs text-rose-400/80">{error}</p>
            </section>
          ) : null}

          {hasSearched && !error && paths.length === 0 ? (
            <section className="mt-6 rounded-xl border border-slate-800 bg-slate-900/40 p-6 text-center">
              <p className="text-sm text-slate-400">
                No routes found between these assets at this amount.
              </p>
            </section>
          ) : null}

          {paths.length > 0 ? (
            <div className="mt-8 space-y-8">
              <PathComparison paths={paths} />
              <section className="space-y-3">
                <p className="text-xs uppercase tracking-wider text-slate-500">
                  All {paths.length} path{paths.length === 1 ? "" : "s"} · click
                  a row to inspect the route
                </p>
                <PathList paths={paths} />
              </section>
            </div>
          ) : null}
        </>
      )}
    </main>
  );
}
