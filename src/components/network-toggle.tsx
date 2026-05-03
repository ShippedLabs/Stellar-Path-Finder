"use client";

import { useNetwork } from "@/hooks/use-network";
import type { Network } from "@/types/path";

const OPTIONS: { value: Network; label: string }[] = [
  { value: "mainnet", label: "Mainnet" },
  { value: "testnet", label: "Testnet" },
];

export function NetworkToggle() {
  const { network, setNetwork, ready } = useNetwork();

  return (
    <div
      role="radiogroup"
      aria-label="Stellar network"
      className="inline-flex items-center gap-1 rounded-full border border-slate-800 bg-slate-900/60 p-1"
    >
      {OPTIONS.map((option) => {
        const active = ready && network === option.value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => setNetwork(option.value)}
            className={
              "rounded-full px-4 py-1.5 text-sm font-medium transition-colors " +
              (active
                ? "bg-emerald-500 text-slate-950"
                : "text-slate-400 hover:text-slate-100")
            }
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
