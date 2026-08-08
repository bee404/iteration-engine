import type { Critique, Direction } from "@/lib/types";

/**
 * One direction inside a demo fixture: the exact `Direction` shape the real providers return,
 * plus the verbatim code-gen output captured for it (if any).
 *
 * `capturedCode` is the real code a live run produced for this direction. When it's null we
 * simply have no real capture for that direction yet — demo mode then streams a typed "no
 * capture" code-gen error (exercising the shipped error state) rather than inventing fake
 * output. Dropping a new real capture in is a one-field change: paste the code, done.
 */
export interface DemoDirection {
  direction: Direction;
  capturedCode: string | null;
}

/**
 * A complete, self-contained captured example: the inputs a real round was run with, and the
 * real critique / directions / code-gen output it produced. Everything a reviewer needs to
 * walk upload -> critique -> directions -> code streaming on canned data.
 *
 * New examples (e.g. the forthcoming Hightouch-prototype export) slot in by appending another
 * DemoFixture to the registry in ./examples.ts — no provider or format changes needed.
 */
export interface DemoFixture {
  /** Stable id, selectable via DEMO_FIXTURE=<id>. */
  id: string;
  /** Human label for the example. */
  label: string;
  /** Where the captured data came from, for provenance. */
  provenance: string;
  /** The real inputs this round was run with (suggested values for a reviewer to paste). */
  inputs: {
    designGoal: string;
    feedbackText: string;
    reviewerContext: string | null;
    constraints: string | null;
  };
  critique: Critique;
  directions: DemoDirection[];
}

