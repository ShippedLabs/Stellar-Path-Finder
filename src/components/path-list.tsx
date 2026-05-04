"use client";

import { useMemo, useState } from "react";
import { assetLabel } from "@/types/path";
import type { Path } from "@/types/path";

type SortKey = "rate" | "send" | "receive" | "hops";
type SortDir = "asc" | "desc";

interface Props {
  paths: Path[];
}

const COLUMNS: { key: SortKey | "pair"; label: string; sortable: boolean }[] = [
  { key: "pair", label: "Pair", sortable: false },
  { key: "send", label: "Send", sortable: true },
  { key: "receive", label: "Receive", sortable: true },
  { key: "rate", label: "Rate", sortable: true },
  { key: "hops", label: "Hops", sortable: true },
];

function compare(a: Path, b: Path, key: SortKey): number {
  switch (key) {
    case "rate":
      return Number(a.rate) - Number(b.rate);
    case "send":
      return Number(a.sourceAmount) - Number(b.sourceAmount);
    case "receive":
      return Number(a.destinationAmount) - Number(b.destinationAmount);
    case "hops":
      return a.hops.length - b.hops.length;
  }
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

export function PathList({ paths }: Props) {
  const [sortKey, setSortKey] = useState<SortKey>("rate");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const sorted = useMemo(() => {
    const list = [...paths];
    list.sort((a, b) => {
      const cmp = compare(a, b, sortKey);
      return sortDir === "asc" ? cmp : -cmp;
    });
    return list;
  }, [paths, sortKey, sortDir]);

  const handleSort = (key: SortKey) => {
    if (key === sortKey) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
      return;
    }
    setSortKey(key);
    setSortDir(key === "hops" ? "asc" : "desc");
  };

  if (paths.length === 0) {
    return null;
  }

  return (
    <div className="overflow-hidden rounded-xl border border-slate-800">
      <table className="w-full text-left text-sm">
        <thead className="bg-slate-900/60 text-xs uppercase tracking-wider text-slate-500">
          <tr>
            {COLUMNS.map((col) => (
              <th key={col.key} scope="col" className="px-4 py-3 font-medium">
                {col.sortable ? (
                  <button
                    type="button"
                    onClick={() => handleSort(col.key as SortKey)}
                    className="inline-flex items-center gap-1 transition-colors hover:text-slate-200"
                  >
                    <span>{col.label}</span>
                    <span aria-hidden className="w-3 text-emerald-400">
                      {sortKey === col.key ? (sortDir === "asc" ? "↑" : "↓") : ""}
                    </span>
                  </button>
                ) : (
                  col.label
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800">
          {sorted.map((path, i) => (
            <tr
              key={i}
              className="bg-slate-900/20 transition-colors hover:bg-slate-900/40"
            >
              <td className="px-4 py-3 font-medium text-slate-100">
                {assetLabel(path.source)}
                <span className="mx-1.5 text-slate-600">→</span>
                {assetLabel(path.destination)}
              </td>
              <td className="px-4 py-3 text-slate-300">
                {formatAmount(path.sourceAmount)}{" "}
                <span className="text-slate-500">{assetLabel(path.source)}</span>
              </td>
              <td className="px-4 py-3 text-slate-300">
                {formatAmount(path.destinationAmount)}{" "}
                <span className="text-slate-500">
                  {assetLabel(path.destination)}
                </span>
              </td>
              <td className="px-4 py-3 font-medium text-emerald-300">
                {formatAmount(path.rate)}
              </td>
              <td className="px-4 py-3 text-slate-400">{path.hops.length}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
