"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { NoRoutesEmptyState } from "@/components/no-routes-empty-state";
import { PathComparison } from "@/components/path-comparison";
import { PathForm } from "@/components/path-form";
import { PathList } from "@/components/path-list";
import { ResultsSkeleton } from "@/components/results-skeleton";
import { SavedPairsChips } from "@/components/saved-pairs-chips";
import { useInterval } from "@/hooks/use-interval";
import { useNetwork } from "@/hooks/use-network";
import { usePaths } from "@/hooks/use-paths";
import { fetchRateHistory } from "@/lib/trade-aggregations";
import { pathChainKey } from "@/types/path";
import type { RateChange, RateHistoryPoint } from "@/types/path";

// Re-fetch interval for live polling, in milliseconds.
const LIVE_POLL_MS = 15_000;
const DAILY_AGGREGATION_MS = 24 * 60 * 60 * 1000;

const RateChart = dynamic(
  () => import("@/components/rate-chart").then((mod) => mod.RateChart),
  {
    ssr: false,
    loading: () => (
      <section className="rounded-xl border border-slate-700 bg-slate-900/40 p-4 sm:p-5">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          Historical rate
        </p>
        <div className="mt-4 h-56 animate-pulse rounded-lg bg-slate-800/70" />
      </section>
    ),
  },
);

export default function HomePage() {
  const { network } = useNetwork();
  const { paths, loading, error, hasSearched, lastInput, search, refetch, reset } =
    usePaths();
  const lastNetwork = useRef(network);

  // Accessibility: State for ARIA live region announcements
  const [announcement, setAnnouncement] = useState("");

  // Live polling: re-run the last search on an interval and highlight how each
  // route's rate has moved since the previous fetch.
  const [live, setLive] = useState(false);
  const [rateChanges, setRateChanges] = useState<Map<string, RateChange>>(
    () => new Map(),
  );
  const [rateHistory, setRateHistory] = useState<RateHistoryPoint[]>([]);
  const [rateHistoryLoading, setRateHistoryLoading] = useState(false);
  // Previous fetch's rate per route (keyed by asset chain). A ref so updating
  // the baseline never triggers a re-render.
  const prevRatesRef = useRef<Map<string, number>>(new Map());

  // A poll re-fetch keeps the existing results on screen (only the initial /
  // empty load shows the skeleton).
  const isPolling = live && paths.length > 0;

  useEffect(() => {
    if (lastNetwork.current === network) return;
    lastNetwork.current = network;
    reset();
    setLive(false);
    prevRatesRef.current = new Map();
    setRateChanges(new Map());
    setRateHistory([]);
    setRateHistoryLoading(false);
    setAnnouncement(""); // clear on network reset
  }, [network, reset]);

  // A new search target invalidates the polling baseline so stale indicators
  // never carry over. Polling re-fetches reuse the same lastInput reference, so
  // this only fires on a genuinely new search — not on each poll.
  useEffect(() => {
    prevRatesRef.current = new Map();
    setRateChanges(new Map());
  }, [lastInput]);

  // Stop polling if a fetch fails, rather than hammering a failing endpoint.
  useEffect(() => {
    if (error) setLive(false);
  }, [error]);

  useEffect(() => {
    if (!lastInput || error || paths.length === 0 || loading) {
      setRateHistory([]);
      setRateHistoryLoading(false);
      return;
    }

    let active = true;
    setRateHistoryLoading(true);
    void fetchRateHistory(
      lastInput.network,
      lastInput.source,
      lastInput.destination,
      DAILY_AGGREGATION_MS,
    )
      .then((history) => {
        if (active) setRateHistory(history);
      })
      .catch(() => {
        if (active) setRateHistory([]);
      })
      .finally(() => {
        if (active) setRateHistoryLoading(false);
      });

    return () => {
      active = false;
    };
  }, [lastInput, paths.length, loading, error]);

  // Drive the polling loop. Passing `null` while inactive clears the interval;
  // the guard plus the disabled toggle prevent overlapping requests, and the
  // hook clears the timer on unmount.
  useInterval(
    () => {
      if (!loading) void refetch();
    },
    live ? LIVE_POLL_MS : null,
  );

  // After each fetch, compare the new rate of every route against the baseline.
  useEffect(() => {
    if (!live) return;

    const current = new Map<string, number>();
    for (const path of paths) current.set(pathChainKey(path), Number(path.rate));

    const prev = prevRatesRef.current;
    if (prev.size === 0) {
      // First fetch since polling started: establish the baseline silently.
      prevRatesRef.current = current;
      return;
    }

    let moved = false;
    const next = new Map<string, RateChange>();
    for (const [key, rate] of current) {
      const before = prev.get(key);
      if (before === undefined) continue;
      if (rate > before) {
        next.set(key, "up");
        moved = true;
      } else if (rate < before) {
        next.set(key, "down");
        moved = true;
      } else {
        next.set(key, "same");
      }
    }

    // Ignore re-renders where no rate actually changed (e.g. background hop-rate
    // enrichment) so a freshly shown indicator is not wiped a moment later.
    if (!moved) return;
    prevRatesRef.current = current;
    setRateChanges(next);
  }, [paths, live]);

  const toggleLive = useCallback(() => {
    setLive((on) => {
      const next = !on;
      if (!next) {
        // Turning off: stop tracking and clear indicators immediately.
        prevRatesRef.current = new Map();
        setRateChanges(new Map());
      }
      return next;
    });
  }, []);

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

      {loading && !isPolling ? (
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
            <NoRoutesEmptyState input={lastInput} />
          ) : null}

          {paths.length > 0 ? (
            <div className="mt-8 space-y-8">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
                  Rates update with order book activity
                </p>
                <button
                  type="button"
                  onClick={toggleLive}
                  disabled={loading}
                  aria-pressed={live}
                  aria-label={
                    live ? "Turn off live rate updates" : "Turn on live rate updates"
                  }
                  className={
                    "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:cursor-not-allowed disabled:opacity-50 " +
                    (live
                      ? "border-emerald-500 bg-emerald-500/10 text-emerald-300"
                      : "border-slate-700 bg-slate-900/40 text-slate-300 hover:border-slate-600")
                  }
                >
                  <span
                    aria-hidden="true"
                    className={
                      "inline-block h-2 w-2 rounded-full " +
                      (live
                        ? loading
                          ? "animate-pulse bg-emerald-400"
                          : "bg-emerald-400"
                        : "bg-slate-500")
                    }
                  />
                  {live ? (loading ? "Updating…" : "Live") : "Go live"}
                </button>
              </div>
              <PathComparison paths={paths} rateChanges={rateChanges} />
              {!loading ? (
                <RateChart data={rateHistory} loading={rateHistoryLoading} />
              ) : null}
              <section className="space-y-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  All {paths.length} path{paths.length === 1 ? "" : "s"} · click
                  a row to inspect the route
                </p>
                <PathList
                  paths={paths}
                  direction={lastInput?.direction ?? "strict-send"}
                  network={lastInput?.network ?? "mainnet"}
                  rateChanges={rateChanges}
                />
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
