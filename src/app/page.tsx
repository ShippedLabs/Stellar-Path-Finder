export default function HomePage() {
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
        <p className="text-slate-400">
          Form, route graph, and comparison table land in upcoming commits.
        </p>
      </section>
    </main>
  );
}
