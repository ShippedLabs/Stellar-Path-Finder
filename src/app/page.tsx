"use client";

import { useState } from "react";
import { PathForm } from "@/components/path-form";
import type { FindPathsInput } from "@/types/path";

export default function HomePage() {
  const [lastInput, setLastInput] = useState<FindPathsInput | null>(null);

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
        <PathForm onSubmit={setLastInput} />
      </section>

      {lastInput ? (
        <section className="mt-6 rounded-xl border border-slate-800 bg-slate-900/40 p-4">
          <p className="mb-2 text-xs uppercase tracking-wider text-slate-500">
            Last submission (paths land in next commit)
          </p>
          <pre className="overflow-x-auto text-xs text-slate-300">
            {JSON.stringify(lastInput, null, 2)}
          </pre>
        </section>
      ) : null}
    </main>
  );
}
