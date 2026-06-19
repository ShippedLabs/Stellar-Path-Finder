"use client";

import { Fragment, useMemo, useState, useRef } from "react";
import { PathGraph } from "@/components/path-graph";
import { assetKey, assetLabel } from "@/types/path";
import type { Direction, Network, Path } from "@/types/path";

type SortKey = "rate" | "send" | "receive" | "hops";
type SortDir = "asc" | "desc";

interface Props {
  paths: Path[];
  direction: Direction;
  network: Network;
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

export function PathList({ paths, direction, network }: Props) {
  const [sortKey, setSortKey] = useState<SortKey>("rate");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Accessibility: Focus management refs
  const rowRefs = useRef<Map<string, HTMLTableRowElement | null>>(new Map());
  const expandedContainerRef = useRef<HTMLTableRowElement>(null);

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
    setSelectedId((prev) => {
      if (prev === id) {
        // Accessibility: Return focus to trigger row when closing
        setTimeout(() => {
          rowRefs.current.get(id)?.focus();
        }, 0);
        return null;
      } else {
        // Accessibility: Move focus to expanded content when opening
        setTimeout(() => {
          expandedContainerRef.current?.focus();
        }, 0);
        return id;
      }
    });
  };

  if (paths.length === 0) {
    return null;
  }

  return (
    <div className="overflow-hidden rounded-xl border border-slate-700">
      <table className="w-full text-left text-sm">
        <thead className="bg-slate-900/60 text-xs font-semibold uppercase tracking-wider text-slate-300">
          <tr>
            {COLUMNS.map((col) => {
              const isSorted = sortKey === col.key;
              const ariaSort = !col.sortable
                ? undefined
                : isSorted
                  ? sortDir === "asc"
                    ? "ascending"
                    : "descending"
                  : "none";

              return (
                <th
                  key={col.key}
                  scope="col"
                  aria-sort={ariaSort}
                  className={
                    "px-4 py-3 font-medium" +
                    (col.mobileHidden ? " hidden sm:table-cell" : "")
                  }
                >
                  {col.sortable ? (
                    <button
                      type="button"
                      onClick={() => handleSort(col.key as SortKey)}
                      // Accessibility: Dynamic aria-label for sort buttons
                      aria-label={`Sort by ${col.label}, currently ${
                        isSorted
                          ? sortDir === "asc"
                            ? "ascending"
                            : "descending"
                          : "not sorted"
                      }`}
                      className="inline-flex items-center gap-1 transition-colors hover:text-emerald-300 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2 focus:ring-offset-slate-900 rounded-sm"
                    >
                      <span>{col.label}</span>
                      <span aria-hidden="true" className="w-3 text-emerald-400">
                        {isSorted ? (sortDir === "asc" ? "↑" : "↓") : ""}
                      </span>
                    </button>
                  ) : (
                    col.label
                  )}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-700">
          {sorted.map((path) => {
            const id = pathId(path);
            const isSelected = id === selectedId;
            return (
              <Fragment key={id}>
                <tr
                  // Accessibility: Link ref to row for focus return
                  ref={(el) => {
                    rowRefs.current.set(id, el);
                  }}
                  role="button"
                  tabIndex={0}
                  aria-expanded={isSelected}
                  aria-controls={isSelected ? `expanded-${id}` : undefined}
                  onClick={() => toggleSelect(id)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      toggleSelect(id);
                    }
                  }}
                  className={
                    "cursor-pointer transition-colors focus:outline-none focus:ring-2 focus:ring-inset focus:ring-emerald-400 " +
                    (isSelected
                      ? "bg-emerald-500/10 hover:bg-emerald-500/15"
                      : "bg-slate-900/20 hover:bg-slate-900/40")
                  }
                >
                  <td className="px-4 py-3 font-medium text-slate-100">
                    <span
                      aria-hidden="true"
                      className={
                        "mr-2 inline-block w-3 text-xs transition-transform " +
                        (isSelected ? "text-emerald-400" : "text-slate-400")
                      }
                    >
                      {isSelected ? "▾" : "▸"}
                    </span>
                    {assetLabel(path.source)}
                    <span className="mx-1.5 text-slate-400" aria-hidden="true">→</span>
                    {assetLabel(path.destination)}
                  </td>
                  <td className="hidden px-4 py-3 text-slate-200 sm:table-cell">
                    {formatAmount(path.sourceAmount)}{" "}
                    <span className="text-slate-400">
                      {assetLabel(path.source)}
                    </span>
                  </td>
                  <td className="hidden px-4 py-3 text-slate-200 sm:table-cell">
                    {formatAmount(path.destinationAmount)}{" "}
                    <span className="text-slate-400">
                      {assetLabel(path.destination)}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-medium text-emerald-300">
                    {formatAmount(path.rate)}
                  </td>
                  <td className="px-4 py-3 text-slate-300">
                    {path.hops.length}
                  </td>
                </tr>
                {isSelected ? (
                  <tr
                    id={`expanded-${id}`}
                    // Accessibility: Container ref and tabIndex for programmatic focus
                    ref={expandedContainerRef}
                    tabIndex={-1}
                    className="bg-slate-950 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-emerald-400"
                  >
                    <td colSpan={COLUMNS.length} className="px-4 py-4">
                      <PathGraph
                        path={path}
                        direction={direction}
                        network={network}
                      />
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
