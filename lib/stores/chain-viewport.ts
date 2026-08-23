import { create } from "zustand";

import type { ImageDimensions } from "@/lib/types";

/** Whether the current box is Coquí's read of the screenshot or Bryan's correction of it. */
export type ViewportBoxSource = "inferred" | "corrected";

/**
 * The chain's viewport box, as a state machine rather than a box plus flags: there is no
 * measured-but-sourceless box, and no locked box without a measurement to lock.
 */
export type ChainViewport =
  | { status: "unmeasured" }
  | { status: "open"; box: ImageDimensions; source: ViewportBoxSource }
  | { status: "locked"; box: ImageDimensions };

interface ChainViewportState {
  viewport: ChainViewport;
  /** Records what a screenshot decodes to. Ignored once locked — Decision 14 forbids a later
   *  screenshot silently re-measuring a chain that already committed an iteration. */
  inferBox: (dimensions: ImageDimensions | null) => void;
  /** Replaces the inferred measurement with Bryan's. Rejected once locked, for the same reason. */
  correctBox: (box: ImageDimensions) => void;
  /** The commit point: from here the box is the chain's, not the round's. Idempotent. */
  lockBox: () => void;
  /** Tears the lock down when a genuinely new chain starts (no UI reaches this yet). */
  startNewChain: () => void;
}

/** The box only once it is the chain's — an open, still-correctable measurement is not one. */
export function lockedBoxOf(viewport: ChainViewport): ImageDimensions | null {
  return viewport.status === "locked" ? viewport.box : null;
}

/**
 * Decision 14's viewport box, held for the whole chain rather than per round: the first round
 * infers it and Bryan may correct it, the first committed iteration locks it, and every later
 * round reads the locked box instead of measuring its own reference again.
 *
 * In memory only, like the round image it describes (lib/stores/round-image.ts). The durable copy
 * travels on the round itself (`Round.lockedViewport`) and is propagated onto each new round in
 * the chain at persist time (lib/persist-round.ts).
 */
export const useChainViewport = create<ChainViewportState>((set) => ({
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
      state.viewport.status === "open" ? { viewport: { status: "locked", box: state.viewport.box } } : state,
    ),

  startNewChain: () => set({ viewport: { status: "unmeasured" } }),
}));

