"use client";

import { useCallback, useState } from "react";

export interface ElementSize {
  width: number;
  height: number;
}

/**
 * Tracks an element's content-box size, starting null until the first measurement lands so
 * callers can tell "not measured yet" apart from "measured as zero". Uses a callback ref rather
 * than a `useRef` + effect pair so the observer attaches the moment the node exists and detaches
 * when it's swapped or unmounted — no stale observer, no measure-after-paint flash.
 */
export function useElementSize(): [(node: HTMLElement | null) => void, ElementSize | null] {
  const [size, setSize] = useState<ElementSize | null>(null);

  const ref = useCallback((node: HTMLElement | null) => {
    if (!node) {
      setSize(null);
      return;
    }
    const observer = new ResizeObserver(([entry]) => {
      const rect = entry.contentRect;
      setSize({ width: rect.width, height: rect.height });
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return [ref, size];
}

