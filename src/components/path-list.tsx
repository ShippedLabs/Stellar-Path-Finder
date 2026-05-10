"use client";

import { Fragment, useMemo, useState } from "react";
import { PathGraph } from "@/components/path-graph";
import { assetKey, assetLabel } from "@/types/path";
import type { Path } from "@/types/path";

type SortKey = "rate" | "send" | "receive" | "hops";
type SortDir = "asc" | "desc";

interface Props {
  paths: Path[];
}

const COLUMNS: {
  key: SortKey | "pair";
  label: string;
  sortable: boolean;
  mobileHidden?: boolean;
}[] = [
  { key: "pair", label: "Pair", sortable: false },
  { key: "send", label: "Send", sortable: true, mobileHidden: true },
  { key: "receive", label: "Receive", sortable: true, mobileHidden: true },
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

function pathId(path: Path): string {
  return [
    assetKey(path.source),
    ...path.hops.map(assetKey),
    assetKey(path.destination),
    path.sourceAmount,
    path.destinationAmount,
  ].join("|");
}

export function PathList({ paths }: Props) {
  const [sortKey, setSortKey] = useState<SortKey>("rate");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [selectedId, setSelectedId] = useState<string | null>(null);

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

  const toggleSelect = (id: string) => {
    setSelectedId((prev) => (prev === id ? null : id));
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
              <th
                key={col.key}
                scope="col"
                className={
                  "px-4 py-3 font-medium" +
                  (col.mobileHidden ? " hidden sm:table-cell" : "")
                }
              >
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
          {sorted.map((path) => {
            const id = pathId(path);
            const isSelected = id === selectedId;
            return (
              <Fragment key={id}>
                <tr
                  role="button"
                  tabIndex={0}
                  aria-expanded={isSelected}
                  onClick={() => toggleSelect(id)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      toggleSelect(id);
                    }
                  }}
                  className={
                    "cursor-pointer transition-colors " +
                    (isSelected
                      ? "bg-emerald-500/5 hover:bg-emerald-500/10"
                      : "bg-slate-900/20 hover:bg-slate-900/40")
                  }
                >
                  <td className="px-4 py-3 font-medium text-slate-100">
                    <span
                      aria-hidden
                      className={
                        "mr-2 inline-block w-3 text-xs transition-transform " +
                        (isSelected ? "text-emerald-400" : "text-slate-600")
                      }
                    >
                      {isSelected ? "▾" : "▸"}
                    </span>
                    {assetLabel(path.source)}
                    <span className="mx-1.5 text-slate-600">→</span>
                    {assetLabel(path.destination)}
                  </td>
                  <td className="hidden px-4 py-3 text-slate-300 sm:table-cell">
                    {formatAmount(path.sourceAmount)}{" "}
                    <span className="text-slate-500">
                      {assetLabel(path.source)}
                    </span>
                  </td>
                  <td className="hidden px-4 py-3 text-slate-300 sm:table-cell">
                    {formatAmount(path.destinationAmount)}{" "}
                    <span className="text-slate-500">
                      {assetLabel(path.destination)}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-medium text-emerald-300">
                    {formatAmount(path.rate)}
                  </td>
                  <td className="px-4 py-3 text-slate-400">
                    {path.hops.length}
                  </td>
                </tr>
                {isSelected ? (
                  <tr className="bg-slate-950">
                    <td colSpan={COLUMNS.length} className="px-4 py-4">
                      <PathGraph path={path} />
                    </td>
                  </tr>
                ) : null}
              </Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
