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

    // ResizeObserver reports asynchronously. Measure once immediately so a fixed-aspect child
    // never paints against the caller's unmeasured fallback (which previously produced a tall,
    // stage-filling comparison box during Source / Iteration switches).
    const initialRect = node.getBoundingClientRect();
    setSize({ width: initialRect.width, height: initialRect.height });

    const observer = new ResizeObserver((entries) => {
      // Only ever one observed node, but the entry list is still index-access: a spec-legal
      // empty batch must not throw.
      const entry = entries[0];
      if (!entry) return;
      const { width, height } = entry.contentRect;
      setSize({ width, height });
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return [ref, size];
}
