/**
 * Domain types shared across API routes, providers, the Zustand store, and UI.
 * These are the shapes that get persisted to Turso (see lib/db/schema.sql) and
 * returned from the stubbed provider calls (see lib/providers/**).
 */

/** Natural pixel size of an uploaded screenshot, captured client-side at upload time.
 * Load-bearing for the before/after visual diff: the generated component must be scaled to
 * the same viewport the screenshot was captured at. Null until a screenshot with readable
 * dimensions is provided. */
export interface ImageDimensions {
  width: number;
  height: number;
}

export type SignalPreferenceKind = "signal" | "preference";

export interface SignalPreferenceItem {
  kind: SignalPreferenceKind;
  text: string;
}

/** Output of the critique step: signal (real problems) separated from preference (taste). */
export interface Critique {
  summary: string;
  signal: SignalPreferenceItem[];
  preference: SignalPreferenceItem[];
  /** Portions of the raw feedback too vague to act on without clarification. */
  flaggedAmbiguities: string[];
  model: string;
}

/** A comparable layout/pattern reference pulled live from 21st.dev, grounding a direction. */
export interface PatternReference {
  source: "21st.dev";
  name: string;
  url: string;
  description: string;
}

/** One of 2-3 genuinely different iteration directions produced for a round. */
export interface Direction {
  id: string;
  title: string;
  rationale: string;
  tradeoffs: string;
  suggestedChanges: string[];
  patternReference: PatternReference | null;
}

export type GeneratedCodeStatus = "streaming" | "complete" | "error";

/** On-demand, per-direction code/prototype generation result. */
export interface GeneratedCode {
  id: string;
  directionId: string;
  language: string;
  code: string;
  status: GeneratedCodeStatus;
  createdAt: string;
}

export type ApprovalStatus = "pending" | "approved" | "rejected";

export interface Project {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

/** A single round: the inputs that drove it, the critique/directions it produced, and its outcome. */
export interface Round {
  id: string;
  projectId: string;
  /** Links this round to the round it iterates on, for version history across rounds. */
  previousRoundId: string | null;
  screenshotRef: string;
  /** Natural pixel dimensions of screenshotRef, or null for legacy rounds captured before
   * dimension capture existed (or when the image never loaded). */
  screenshotDimensions: ImageDimensions | null;
  /** The chain's viewport box, fixed when its first iteration was committed (Decision 14). Carried
   * onto every later round in the chain rather than re-inferred from that round's own reference,
   * so the comparison box never moves mid-chain. Null for rounds committed before the lock existed. */
  lockedViewport: ImageDimensions | null;
  designGoal: string;
  feedbackText: string;
  reviewerContext: string | null;
  constraints: string | null;
  critique: Critique | null;
  directions: Direction[];
  selectedDirectionId: string | null;
  generatedCode: GeneratedCode[];
  approvalStatus: ApprovalStatus;
  createdAt: string;
  updatedAt: string;
}
