import { create } from "zustand";

import type { ImageDimensions } from "@/lib/types";

/** A screenshot carried from /upload into /feedback for the current round. */
export interface RoundImage {
  /** Data URL (not an object URL) so it survives the /upload component unmounting on navigation. */
  dataUrl: string;
  fileName: string;
  dimensions: ImageDimensions | null;
}

/** The brief the user typed on /feedback, echoed read-only on later steps of the round. */
export interface RoundBrief {
  goal: string;
  feedback: string;
  reviewerContext: string;
  constraints: string;
}

/** Viewport rect of the upload preview at the moment the user proceeds — the origin of the morph. */
export interface TransitionOrigin {
  top: number;
  left: number;
  width: number;
  height: number;
}

interface RoundImageState {
  image: RoundImage | null;
  /** The brief captured on /feedback, read downstream by /directions (and by /synthesized, which
   *  remains reachable directly but is no longer a stop in the normal round flow). */
  brief: RoundBrief | null;
  /** Set while a shared-element transition into /feedback is pending; cleared once it plays (or is skipped). */
  transitionOrigin: TransitionOrigin | null;
  /** Stage the image and arm the morph, then navigate. */
  beginTransition: (image: RoundImage, origin: TransitionOrigin) => void;
  /** Persist the brief the user typed so downstream steps can echo it. */
  setBrief: (brief: RoundBrief) => void;
  /** Called by /feedback once the entrance animation has run (or been skipped). */
  clearTransition: () => void;
  reset: () => void;
}

/**
 * Module-level store holding the round's reference image across the client-side hop from /upload to
 * /feedback. It intentionally lives only in memory: a hard reload of /feedback drops the image and the
 * screen falls back to its empty state rather than persisting a multi-megabyte data URL to storage.
 */
export const useRoundImage = create<RoundImageState>((set) => ({
  image: null,
  brief: null,
  transitionOrigin: null,
  beginTransition: (image, origin) => set({ image, transitionOrigin: origin }),
  setBrief: (brief) => set({ brief }),
  clearTransition: () => set({ transitionOrigin: null }),
  reset: () => set({ image: null, brief: null, transitionOrigin: null }),
}));

