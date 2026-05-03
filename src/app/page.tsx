"use client";

import { PathForm } from "@/components/path-form";
import { usePaths } from "@/hooks/use-paths";

export default function HomePage() {
  const { paths, loading, error, hasSearched, search } = usePaths();

  return (
    <main className="mx-auto max-w-5xl px-6 py-16">
      <header className="space-y-3">
        <p className="text-xs uppercase tracking-[0.2em] text-emerald-400">
          Stellar · Path Payments
        </p>
        <h1 className="text-4xl font-semibold tracking-tight">
          Stellar Path Finder
        </h1>
        <p className="max-w-2xl text-slate-400">
          Compare path payment routes between any two assets on the Stellar
          network. Pick a source, a destination, and an amount — see every hop,
          every price, and the best rate at a glance.
        </p>
      </header>

      <section className="mt-12 rounded-xl border border-slate-800 bg-slate-900/40 p-8">
        <PathForm onSubmit={search} loading={loading} />
      </section>

      {error ? (
        <section className="mt-6 rounded-xl border border-rose-800/60 bg-rose-950/30 p-4">
          <p className="text-sm font-medium text-rose-300">Search failed</p>
          <p className="mt-1 text-xs text-rose-400/80">{error}</p>
        </section>
      ) : null}

      {hasSearched && !loading && !error && paths.length === 0 ? (
        <section className="mt-6 rounded-xl border border-slate-800 bg-slate-900/40 p-6 text-center">
          <p className="text-sm text-slate-400">
            No routes found between these assets at this amount.
          </p>
        </section>
      ) : null}

      {paths.length > 0 ? (
        <section className="mt-6 rounded-xl border border-slate-800 bg-slate-900/40 p-4">
          <p className="mb-3 text-xs uppercase tracking-wider text-slate-500">
            Found {paths.length} path{paths.length === 1 ? "" : "s"} · graph
            and table land in Day 3
          </p>
          <pre className="overflow-x-auto text-xs text-slate-300">
            {JSON.stringify(paths, null, 2)}
          </pre>
        </section>
      ) : null}
    </main>
  );
}
