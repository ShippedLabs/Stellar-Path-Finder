export function ResultsSkeleton() {
  return (
    <div className="mt-8 animate-pulse space-y-8">
      <section className="space-y-3">
        <div className="h-3 w-36 rounded bg-slate-800" />
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="h-36 rounded-xl border border-slate-800 bg-slate-900/40"
            />
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <div className="h-3 w-28 rounded bg-slate-800" />
        <div className="overflow-hidden rounded-xl border border-slate-800">
          <div className="flex gap-6 bg-slate-900/60 px-4 py-3">
            {[
              { w: 140, hide: false },
              { w: 100, hide: true },
              { w: 100, hide: true },
              { w: 60, hide: false },
              { w: 40, hide: false },
            ].map(({ w, hide }, i) => (
              <div
                key={i}
                style={{ width: w }}
                className={
                  "h-2.5 shrink-0 rounded bg-slate-800" +
                  (hide ? " hidden sm:block" : "")
                }
              />
            ))}
          </div>
          {[0, 1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="flex gap-6 border-t border-slate-800 px-4 py-3.5"
            >
              {[
                { w: 140, hide: false },
                { w: 100, hide: true },
                { w: 100, hide: true },
                { w: 60, hide: false },
                { w: 40, hide: false },
              ].map(({ w, hide }, j) => (
                <div
                  key={j}
                  style={{ width: w }}
                  className={
                    "h-2.5 shrink-0 rounded bg-slate-800/70" +
                    (hide ? " hidden sm:block" : "")
                  }
                />
              ))}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
