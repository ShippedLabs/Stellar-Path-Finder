import type { RateChange } from "@/types/path";

interface Props {
  change: RateChange | undefined;
  className?: string;
}

const CONFIG: Record<
  RateChange,
  { symbol: string; className: string; label: string }
> = {
  up: {
    symbol: "▲",
    className: "text-emerald-400",
    label: "Rate improved since last update",
  },
  down: {
    symbol: "▼",
    className: "text-rose-400",
    label: "Rate worsened since last update",
  },
  same: {
    symbol: "•",
    className: "text-slate-500",
    label: "Rate unchanged since last update",
  },
};

/**
 * Small coloured arrow shown next to a route's rate while live polling is on.
 * Renders nothing when `change` is undefined (not tracking).
 */
export function RateChangeIndicator({ change, className = "" }: Props) {
  if (!change) return null;
  const { symbol, className: colour, label } = CONFIG[change];
  return (
    <span
      role="img"
      aria-label={label}
      title={label}
      className={`inline-block text-[0.7em] leading-none ${colour} ${className}`}
    >
      {symbol}
    </span>
  );
}
