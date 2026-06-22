"use client";

import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { RateHistoryPoint } from "@/types/path";

interface Props {
  data: RateHistoryPoint[];
  loading?: boolean;
}

interface ChartPoint {
  date: string;
  close: number;
}

function formatDate(timestamp: number): string {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
  }).format(new Date(timestamp));
}

function formatRate(value: number): string {
  if (!Number.isFinite(value)) return "0";
  if (value === 0) return "0";
  if (Math.abs(value) >= 1) return value.toFixed(4);
  return value.toPrecision(4);
}

export function RateChart({ data, loading = false }: Props) {
  const points: ChartPoint[] = data.map((point) => ({
    date: formatDate(point.timestamp),
    close: Number(point.close),
  }));

  if (loading) {
    return (
      <section className="rounded-xl border border-slate-700 bg-slate-900/40 p-4 sm:p-5">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          Historical rate
        </p>
        <div className="mt-4 h-56 animate-pulse rounded-lg bg-slate-800/70" />
      </section>
    );
  }

  if (points.length === 0) {
    return (
      <section className="rounded-xl border border-slate-700 bg-slate-900/40 p-4 sm:p-5">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          Historical rate
        </p>
        <div className="mt-4 rounded-lg border border-dashed border-slate-700 px-4 py-10 text-center">
          <p className="text-sm text-slate-300">No historical data available</p>
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-xl border border-slate-700 bg-slate-900/40 p-4 sm:p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          Historical rate
        </p>
        <p className="text-xs text-slate-500">30-day daily close</p>
      </div>
      <div className="mt-4 h-64 sm:h-72">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={points} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
            <XAxis
              dataKey="date"
              tick={{ fill: "#94a3b8", fontSize: 12 }}
              tickLine={false}
              axisLine={{ stroke: "#334155" }}
              minTickGap={24}
            />
            <YAxis
              tick={{ fill: "#94a3b8", fontSize: 12 }}
              tickLine={false}
              axisLine={{ stroke: "#334155" }}
              tickFormatter={formatRate}
              width={58}
              domain={["auto", "auto"]}
            />
            <Tooltip
              formatter={(value) => [formatRate(Number(value)), "Close"]}
              labelClassName="text-slate-200"
              contentStyle={{
                background: "#020617",
                border: "1px solid #334155",
                borderRadius: "0.5rem",
                color: "#cbd5e1",
              }}
            />
            <Line
              type="monotone"
              dataKey="close"
              stroke="#34d399"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, fill: "#34d399", stroke: "#022c22" }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
