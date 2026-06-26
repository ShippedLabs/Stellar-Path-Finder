"use client";

import { RateChangeIndicator } from "@/components/rate-change-indicator";
import { assetKey, assetLabel } from "@/types/path";
import type { Path, RateChange } from "@/types/path";

interface Props {
  path: Path;
  selected?: boolean;
  onClick?: () => void;
  rank?: number;
  rateChange?: RateChange;
  /**
   * Liquidity depth ratio relative to the deepest route (0–1). When provided,
   * a proportional depth bar is rendered at the bottom of the card. Omit (or
   * leave undefined) to suppress the bar entirely.
   */
  depthRatio?: number;
}

function formatAmount(value: string): string {
  const n = Number(value);
  if (!Number.isFinite(n)) return value;
  if (n === 0) return "0";
  if (n < 0.0001) return n.toExponential(2);
  if (n < 1) return n.toFixed(7).replace(/0+$/, "").replace(/\.$/, "");
  if (n < 1000) return n.toFixed(4).replace(/0+$/, "").replace(/\.$/, "");
  return n.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

function formatUsd(amount: string, price: number | undefined): string | null {
  if (price === undefined || price === null) return null;
  const amt = Number(amount);
  if (!Number.isFinite(amt)) return null;
  const val = amt * price;
  return "~$" + val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function hopBadge(hops: number): string {
  if (hops === 0) return "Direct";
  if (hops === 1) return "1 hop";
  return `${hops} hops`;
}

export function PathCard({
  path,
  selected = false,
  onClick,
  rank,
  rateChange,
  depthRatio,
}: Props) {
  const interactive = typeof onClick === "function";
  const Tag = interactive ? "button" : "div";
  const sourceLabel = assetLabel(path.source);
  const destLabel = assetLabel(path.destination);
  const rate = Number(path.rate);
  const rateLabel = Number.isFinite(rate)
    ? `1 ${sourceLabel} ≈ ${formatAmount(path.rate)} ${destLabel}`
    : `${sourceLabel} → ${destLabel}`;

  const showDepthBar = typeof depthRatio === "number";
  const depthPct = showDepthBar
    ? Math.round(Math.max(0, Math.min(1, depthRatio)) * 100)
    : 0;

  return (
    <Tag
      type={interactive ? "button" : undefined}
      onClick={onClick}
      aria-pressed={interactive ? selected : undefined}
      className={
        "flex w-full flex-col gap-3 rounded-xl border p-4 text-left transition-colors " +
        (selected
          ? "border-emerald-500 bg-emerald-500/5"
          : "border-slate-800 bg-slate-900/40") +
        (interactive ? " hover:border-slate-700" : "")
      }
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-sm font-medium text-slate-100">
          <span>{sourceLabel}</span>
          <span className="text-slate-600">→</span>
          <span>{destLabel}</span>
        </div>
        <div className="flex items-center gap-2">
          {typeof rank === "number" ? (
            <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-emerald-300">
              #{rank}
            </span>
          ) : null}
          <span
            className={
              "rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider " +
              (path.routeSource === "soroban"
                ? "bg-violet-500/10 text-violet-300"
                : "bg-slate-700/60 text-slate-400")
            }
          >
            {path.routeSource === "soroban" ? "Soroban" : "Classic"}
          </span>
          <span className="rounded-full border border-slate-800 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-slate-400">
            {hopBadge(path.hops.length)}
          </span>
        </div>
      </div>

      <p className="flex items-center gap-1.5 text-base font-semibold text-emerald-300">
        <span>{rateLabel}</span>
        <RateChangeIndicator change={rateChange} />
      </p>

      <dl className="grid grid-cols-2 gap-3 text-xs">
        <div>
          <dt className="text-slate-500">Send</dt>
          <dd className="mt-0.5 font-medium text-slate-200">
            <div>
              {formatAmount(path.sourceAmount)} {sourceLabel}
            </div>
            {usdPrices && usdPrices[assetKey(path.source)] !== undefined && (
              <div className="text-[11px] text-slate-500 mt-0.5">
                {formatUsd(path.sourceAmount, usdPrices[assetKey(path.source)])}
              </div>
            )}
          </dd>
        </div>
        <div>
          <dt className="text-slate-500">Receive</dt>
          <dd className="mt-0.5 font-medium text-slate-200">
            <div>
              {formatAmount(path.destinationAmount)} {destLabel}
            </div>
            {usdPrices && usdPrices[assetKey(path.destination)] !== undefined && (
              <div className="text-[11px] text-slate-500 mt-0.5">
                {formatUsd(path.destinationAmount, usdPrices[assetKey(path.destination)])}
              </div>
            )}
          </dd>
        </div>
      </dl>

      {showDepthBar ? (
        <div aria-label={`Liquidity depth: ${depthPct}% of deepest route`}>
          <div className="mb-1 flex items-center justify-between text-[10px] text-slate-500">
            <span>Liquidity depth</span>
            <span>{depthPct}%</span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
            <div
              className="h-full rounded-full bg-emerald-500/60 transition-all duration-500"
              style={{ width: `${depthPct}%` }}
            />
          </div>
        </div>
      ) : null}
    </Tag>
  );
}
