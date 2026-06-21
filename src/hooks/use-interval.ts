"use client";

import { useEffect, useRef } from "react";

/**
 * Run `callback` every `delay` milliseconds. Pass `delay = null` to pause the
 * interval. The latest `callback` is always invoked without restarting the
 * timer, so closures (e.g. loading/lastInput) stay fresh between ticks and the
 * cadence is never reset by unrelated re-renders. The interval is cleared on
 * unmount and whenever `delay` changes, preventing memory leaks.
 */
export function useInterval(callback: () => void, delay: number | null): void {
  const savedCallback = useRef(callback);

  // Keep the ref pointing at the most recent callback every render.
  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    if (delay === null) return;
    const id = setInterval(() => savedCallback.current(), delay);
    return () => clearInterval(id);
  }, [delay]);
}
