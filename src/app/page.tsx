"use client";

import { useEffect, useRef, useState } from "react";
import { PathComparison } from "@/components/path-comparison";
import { PathForm } from "@/components/path-form";
import { PathList } from "@/components/path-list";
import { ResultsSkeleton } from "@/components/results-skeleton";
import { SavedPairsChips } from "@/components/saved-pairs-chips";
import { useNetwork } from "@/hooks/use-network";
import { usePaths } from "@/hooks/use-paths";

export default function HomePage() {
  const { network } = useNetwork();
  const { paths, loading, error, hasSearched, search, reset } = usePaths();
  const lastNetwork = useRef(network);

  // Accessibility: State for ARIA live region announcements
  const [announcement, setAnnouncement] = useState("");

  useEffect(() => {
    if (lastNetwork.current === network) return;
    lastNetwork.current = network;
    reset();
    setAnnouncement(""); // clear on network reset
  }, [network, reset]);

  // Accessibility: Update announcement when search resolves
  useEffect(() => {
    if (hasSearched && !loading) {
      if (error) {
        setAnnouncement(`Search failed: ${error}`);
      } else if (paths.length === 0) {
        setAnnouncement("No routes found between these assets at this amount.");
      } else {
        setAnnouncement(
          `Found ${paths.length} routes. Sorted by rate, descending.`,
        );
      }
    }
  }, [hasSearched, loading, error, paths.length]);

  return (
    <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-16">
      {/* Accessibility: ARIA live region to announce search results */}
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {announcement}
      </div>

      <header className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-400">
          Stellar · Path Payments
        </p>
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl text-slate-50">
          Stellar Path Finder
        </h1>
        <p className="max-w-2xl text-slate-300">
          Compare path payment routes between any two assets on the Stellar
          network. Pick a source, a destination, and an amount. See every hop,
          every price, and the best rate at a glance.
        </p>
      </header>

      <section className="mt-8 rounded-xl border border-slate-700 bg-slate-900/40 p-5 sm:mt-12 sm:p-8">
        <SavedPairsChips network={network} onSelectPair={search} />
        <PathForm onSubmit={search} loading={loading} />
      </section>

      {loading ? (
        <ResultsSkeleton />
      ) : (
        <>
          {error ? (
            <section className="mt-6 rounded-xl border border-rose-800/60 bg-rose-950/30 p-4">
              <p className="text-sm font-medium text-rose-300">Search failed</p>
              <p className="mt-1 text-sm text-rose-200">{error}</p>
            </section>
          ) : null}

          {hasSearched && !error && paths.length === 0 ? (
            <section className="mt-6 rounded-xl border border-slate-700 bg-slate-900/40 p-6 text-center">
              <p className="text-sm font-medium text-slate-300">
                No routes found between these assets at this amount.
              </p>
            </section>
          ) : null}

          {paths.length > 0 ? (
            <div className="mt-8 space-y-8">
              <PathComparison paths={paths} />
              <section className="space-y-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  All {paths.length} path{paths.length === 1 ? "" : "s"} · click
                  a row to inspect the route
                </p>
                <PathList paths={paths} />
              </section>
            </div>
          ) : null}
        </>
      )}
      <footer className="mt-16 border-t border-slate-700 pt-6 text-center text-sm text-slate-400">
        <a
          href="https://github.com/ShippedLabs/Stellar-Path-Finder"
          target="_blank"
          rel="noopener noreferrer"
          className="transition-colors hover:text-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2 focus:ring-offset-slate-900 rounded-sm"
        >
          View on GitHub
        </a>
        <span className="mx-2" aria-hidden="true">
          ·
        </span>
        <span>Powered by Stellar Horizon</span>
      </footer>
    </main>
  );
}
