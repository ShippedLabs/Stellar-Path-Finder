"use client";

import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import type { Network } from "@/types/path";

const STORAGE_KEY = "spf:network";
const DEFAULT_NETWORK: Network = "mainnet";

let current: Network = DEFAULT_NETWORK;
let hydrated = false;
const listeners = new Set<() => void>();

function isNetwork(value: unknown): value is Network {
  return value === "testnet" || value === "mainnet";
}

function emit() {
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot(): Network {
  return current;
}

function getServerSnapshot(): Network {
  return DEFAULT_NETWORK;
}

export function useNetwork(): {
  network: Network;
  setNetwork: (next: Network) => void;
  ready: boolean;
} {
  const network = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const [ready, setReady] = useState(hydrated);

  useEffect(() => {
    if (!hydrated) {
      try {
        const stored = window.localStorage.getItem(STORAGE_KEY);
        if (isNetwork(stored)) {
          current = stored;
        }
      } catch {}
      hydrated = true;
      emit();
    }
    setReady(true);
  }, []);

  const setNetwork = useCallback((next: Network) => {
    if (current === next) return;
    current = next;
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {}
    emit();
  }, []);

  return { network, setNetwork, ready };
}
