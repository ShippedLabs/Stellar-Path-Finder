"use client";

import { RateChangeIndicator } from "@/components/rate-change-indicator";
import { assetLabel } from "@/types/path";
import type { Path, RateChange } from "@/types/path";

interface Props {
  path: Path;
  selected?: boolean;
  onClick?: () => void;
  rank?: number;
  rateChange?: RateChange;
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
}: Props) {
  const interactive = typeof onClick === "function";
  const Tag = interactive ? "button" : "div";
  const sourceLabel = assetLabel(path.source);
  const destLabel = assetLabel(path.destination);
  const rate = Number(path.rate);
  const rateLabel = Number.isFinite(rate)
    ? `1 ${sourceLabel} ≈ ${formatAmount(path.rate)} ${destLabel}`
    : `${sourceLabel} → ${destLabel}`;

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
            {formatAmount(path.sourceAmount)} {sourceLabel}
          </dd>
        </div>
        <div>
          <dt className="text-slate-500">Receive</dt>
          <dd className="mt-0.5 font-medium text-slate-200">
            {formatAmount(path.destinationAmount)} {destLabel}
          </dd>
        </div>
      </dl>
    </Tag>
  );
}
