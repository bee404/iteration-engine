/**
 * Domain types shared across API routes, providers, the Zustand store, and UI.
 * These are the shapes that get persisted to Turso (see lib/db/schema.sql) and
 * returned from the stubbed provider calls (see lib/providers/**).
 */

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
