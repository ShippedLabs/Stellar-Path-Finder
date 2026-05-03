"use client";

import { useCallback, useEffect, useState } from "react";
import type { Network } from "@/types/path";

const STORAGE_KEY = "spf:network";
const DEFAULT_NETWORK: Network = "mainnet";

function isNetwork(value: unknown): value is Network {
  return value === "testnet" || value === "mainnet";
}

export function useNetwork(): {
  network: Network;
  setNetwork: (next: Network) => void;
  ready: boolean;
} {
  const [network, setNetworkState] = useState<Network>(DEFAULT_NETWORK);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (isNetwork(stored)) setNetworkState(stored);
    } catch {}
    setReady(true);
  }, []);

  const setNetwork = useCallback((next: Network) => {
    setNetworkState(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {}
  }, []);

  return { network, setNetwork, ready };
}
