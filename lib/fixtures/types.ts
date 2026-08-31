import type { Critique, Direction } from "@/lib/types";

/**
 * One direction inside a demo fixture: the exact `Direction` shape the real providers return,
 * plus the verbatim code-gen output captured for it (if any).
 *
 * `capturedCode` is real code from a live run. A demo fixture may intentionally reuse one capture
 * across several direction-selection paths so each path can exercise generation, comparison, and
 * export. The fixture's provenance must say when the capture is shared rather than
 * direction-specific. When this is null, demo mode streams a typed "no capture" error.
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
