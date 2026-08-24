import { create } from "zustand";

import type { Critique, Direction } from "@/lib/types";

/**
 * The live model output for the round currently in flight: the critique produced on /feedback and
 * the directions generated from it on /directions.
 *
 * Deliberately in-memory only, like the round's reference image (see round-image.ts). Persisting it
 * would let a previous round's critique replay into a new one, which is exactly the "same canned
 * answer every time" failure this store was added to eliminate.
 */
interface RoundGenerationState {
  critique: Critique | null;
  directions: Direction[];
  /**
   * Records the critique that produced `directions`, so /directions can tell "already generated for
   * this critique" from "carrying stale output from the previous round". Identity comparison is
   * enough: every critique object here comes fresh off a `/api/critique` response.
   */
  directionsSource: Critique | null;
  setCritique: (critique: Critique) => void;
  setDirections: (critique: Critique, directions: Direction[]) => void;
  reset: () => void;
}

/** The three data fields, separated from the actions so "no round yet" has one definition. */
type RoundGenerationData = Pick<RoundGenerationState, "critique" | "directions" | "directionsSource">;

/** A factory, not a shared constant: each reset gets its own `directions` array. */
function emptyRound(): RoundGenerationData {
  return { critique: null, directions: [], directionsSource: null };
}

export const useRoundGeneration = create<RoundGenerationState>((set) => ({
  ...emptyRound(),
  // A new critique invalidates any directions grounded in the old one. Clearing them here rather
  // than at each call site makes it impossible for a screen to render round N-1's directions
  // beside round N's critique.
  setCritique: (critique) => set({ critique, directions: [], directionsSource: null }),
  setDirections: (critique, directions) => set({ directions, directionsSource: critique }),
  reset: () => set(emptyRound()),
}));
