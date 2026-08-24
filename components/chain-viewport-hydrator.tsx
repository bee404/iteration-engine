"use client";

import { useEffect } from "react";

import { fetchChainLockedViewport } from "@/lib/persist-round";
import { useChainViewport } from "@/lib/stores/chain-viewport";

interface ChainViewportHydratorProps {
  /** False in demo mode, where no round is ever written and so none can be read back. Resolved
   *  on the server from lib/demo-mode.ts rather than duplicated into a public env var. */
  persistenceEnabled: boolean;
}

/**
 * Restores the chain's locked viewport box from the persisted round on load (Decision 14).
 *
 * The box is written durably at persist time (`Round.lockedViewport`), but the state machine that
 * drives the readout lives in memory — so before this existed a hard reload silently dropped a
 * committed lock back to `unmeasured`, and the next round would re-measure a box the chain had
 * already fixed. Mounted once by the (app) route-group layout, above every step screen, so the
 * read happens on any entry point into the flow and survives step navigation without re-running.
 *
 * Renders nothing: it is a load-time side effect on a store, deliberately isolated in its own
 * component rather than buried in a screen that happens to display the box.
 */
export function ChainViewportHydrator({ persistenceEnabled }: ChainViewportHydratorProps) {
  const hydrateLockedBox = useChainViewport((state) => state.hydrateLockedBox);

  useEffect(() => {
    // Demo mode refuses every write, so no chain of its own was ever persisted and there is
    // nothing to read back. Asking anyway would only surface the empty database as an error.
    if (!persistenceEnabled) return;
    let cancelled = false;

    fetchChainLockedViewport()
      .then((box) => {
        if (cancelled || !box) return;
        hydrateLockedBox(box);
      })
      .catch((error: unknown) => {
        // A failed read leaves the chain unmeasured rather than guessing a box; it is a real
        // failure of a load-time read, so it is reported rather than swallowed.
        console.error("Could not restore the chain's locked viewport", error);
      });

    return () => {
      cancelled = true;
    };
  }, [persistenceEnabled, hydrateLockedBox]);

  return null;
}
