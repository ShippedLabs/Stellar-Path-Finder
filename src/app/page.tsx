"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PathComparison } from "@/components/path-comparison";
import { PathForm } from "@/components/path-form";
import { PathList } from "@/components/path-list";
import { ResultsSkeleton } from "@/components/results-skeleton";
import { SavedPairsChips } from "@/components/saved-pairs-chips";
import { useNetwork } from "@/hooks/use-network";
import { usePaths } from "@/hooks/use-paths";
import { findAsset } from "@/lib/asset-registry";
import type { AssetRef, Direction, FindPathsInput, Network } from "@/types/path";

// ─── URL param helpers ────────────────────────────────────────────────────────

/**
 * Serialise an AssetRef into the two query-string fragments the URL uses:
 *   ?src=XLM            (native)
 *   ?src=USDC:GA5ZS…    (issued)
 */
function encodeAsset(asset: AssetRef): string {
  return asset.type === "native" ? "XLM" : `${asset.code}:${asset.issuer ?? ""}`;
}

/**
 * Parse a raw param string back into an AssetRef.
 * Returns undefined on malformed input so callers can fall back to defaults.
 */
function decodeAsset(raw: string | null, network: Network): AssetRef | undefined {
  if (!raw) return undefined;
  const trimmed = raw.trim();
  if (trimmed === "XLM") return { type: "native", code: "XLM" };

  const colonIdx = trimmed.indexOf(":");
  if (colonIdx === -1) return undefined;

  const code = trimmed.slice(0, colonIdx).trim();
  const issuer = trimmed.slice(colonIdx + 1).trim();

  // Reject obviously bad codes / issuers.
  if (!code || code.length > 12) return undefined;
  if (issuer && issuer.length < 40) return undefined;

  // Prefer the known-asset registry entry when available so the AssetSelector
  // renders the correct label; otherwise return a minimal AssetRef.
  return findAsset(network, code, issuer) ?? { type: "credit_alphanum4", code, issuer };
}

function isDirection(raw: string | null): raw is Direction {
  return raw === "strict-send" || raw === "strict-receive";
}

function isNetwork(raw: string | null): raw is Network {
  return raw === "mainnet" || raw === "testnet";
}

/**
 * Build the URLSearchParams for a given search input.
 */
function buildSearchParams(input: FindPathsInput): URLSearchParams {
  const p = new URLSearchParams();
  p.set("src", encodeAsset(input.source));
  p.set("dst", encodeAsset(input.destination));
  p.set("amount", input.amount);
  p.set("dir", input.direction);
  p.set("net", input.network);
  return p;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function HomePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { network, setNetwork, ready } = useNetwork();
  const { paths, loading, error, hasSearched, search, reset } = usePaths();
  const lastNetwork = useRef(network);

  // Accessibility: State for ARIA live region announcements
  const [announcement, setAnnouncement] = useState("");

  // Track whether we have already triggered the initial URL-seeded search so
  // we only run it once after the network store hydrates.
  const didBootstrap = useRef(false);

  // ── Bootstrap: read URL params on first hydration ──────────────────────────
  useEffect(() => {
    if (!ready || didBootstrap.current) return;
    didBootstrap.current = true;

    const rawNet = searchParams.get("net");
    const rawSrc = searchParams.get("src");
    const rawDst = searchParams.get("dst");
    const rawAmount = searchParams.get("amount");
    const rawDir = searchParams.get("dir");

    // Nothing in the URL — nothing to do.
    if (!rawSrc && !rawDst && !rawAmount) return;

    // Resolve network first so asset lookups use the right registry.
    const targetNetwork: Network = isNetwork(rawNet) ? rawNet : network;
    if (targetNetwork !== network) setNetwork(targetNetwork);

    const source = decodeAsset(rawSrc, targetNetwork);
    const destination = decodeAsset(rawDst, targetNetwork);
    const direction: Direction = isDirection(rawDir) ? rawDir : "strict-send";
    const amount = rawAmount?.trim() ?? "";
    const numericAmount = Number(amount);
    const validAmount = Number.isFinite(numericAmount) && numericAmount > 0;

    // Only trigger auto-search when the params are complete & valid.
    if (source && destination && validAmount) {
      void search({ network: targetNetwork, direction, source, destination, amount });
    }
    // Malformed / partial params: form will show with whatever defaults it has,
    // no crash, no search.
  }, [ready]); // eslint-disable-line react-hooks/exhaustive-deps
  // ↑ intentionally omitting other deps — this is a one-shot bootstrap effect.

  // ── Network change: reset everything ──────────────────────────────────────
  useEffect(() => {
    if (lastNetwork.current === network) return;
    lastNetwork.current = network;
    reset();
    setAnnouncement("");
  }, [network, reset]);

  // ── Accessibility: announce results ───────────────────────────────────────
  useEffect(() => {
    if (hasSearched && !loading) {
      if (error) {
        setAnnouncement(`Search failed: ${error}`);
      } else if (paths.length === 0) {
        setAnnouncement("No routes found between these assets at this amount.");
      } else {
        setAnnouncement(`Found ${paths.length} routes. Sorted by rate, descending.`);
      }
    }
  }, [hasSearched, loading, error, paths.length]);

  // ── User-initiated search: push URL ───────────────────────────────────────
  const handleSearch = useCallback(
    (input: FindPathsInput) => {
      // Push a history entry so the back button returns to the previous search.
      const params = buildSearchParams(input);
      router.push(`?${params.toString()}`, { scroll: false });
      void search(input);
    },
    [router, search],
  );

  // Derive initial values from current URL params for the form.  This lets
  // PathForm pre-populate its controlled state on the first render after
  // hydration without needing a separate effect in the form itself.
  const urlNetwork: Network = isNetwork(searchParams.get("net"))
    ? (searchParams.get("net") as Network)
    : network;
  const initialSource = decodeAsset(searchParams.get("src"), urlNetwork);
  const initialDestination = decodeAsset(searchParams.get("dst"), urlNetwork);
  const initialAmount = searchParams.get("amount")?.trim() ?? "";
  const initialDirection: Direction = isDirection(searchParams.get("dir"))
    ? (searchParams.get("dir") as Direction)
    : "strict-send";

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
        <SavedPairsChips network={network} onSelectPair={handleSearch} />
        <PathForm
          onSubmit={handleSearch}
          loading={loading}
          initialSource={initialSource}
          initialDestination={initialDestination}
          initialAmount={initialAmount}
          initialDirection={initialDirection}
        />
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
