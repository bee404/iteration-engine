import { create } from "zustand";

import type { ImageDimensions } from "@/lib/types";

export type ViewportBoxSource = "inferred" | "corrected";

export type RoundViewport =
  | { status: "unmeasured" }
  | { status: "open"; box: ImageDimensions; source: ViewportBoxSource }
  | { status: "locked"; box: ImageDimensions };

interface RoundViewportState {
  viewport: RoundViewport;
  inferBox: (dimensions: ImageDimensions | null) => void;
  correctBox: (box: ImageDimensions) => void;
  lockBox: () => void;
  reset: () => void;
}

export function lockedBoxOf(viewport: RoundViewport): ImageDimensions | null {
  return viewport.status === "locked" ? viewport.box : null;
}

/**
 * The fixed comparison box for one V0 exploration. It can be corrected before code generation,
 * locks when generation starts, and resets with the rest of the in-memory round.
 */
export const useRoundViewport = create<RoundViewportState>((set) => ({
  viewport: { status: "unmeasured" },

  inferBox: (dimensions) =>
    set((state) => {
      if (state.viewport.status === "locked") return state;
      if (!dimensions) return { viewport: { status: "unmeasured" } };
      return { viewport: { status: "open", box: dimensions, source: "inferred" } };
    }),
  correctBox: (box) =>
    set((state) =>
      state.viewport.status === "locked"
        ? state
        : { viewport: { status: "open", box, source: "corrected" } },
    ),
  lockBox: () =>
    set((state) =>
      state.viewport.status === "open"
        ? { viewport: { status: "locked", box: state.viewport.box } }
        : state,
    ),
  reset: () => set({ viewport: { status: "unmeasured" } }),
}));
