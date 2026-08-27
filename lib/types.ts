/**
 * Domain types shared across API routes, providers, the transient Zustand store, and UI.
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

/** The backend that actually completed a prototype generation, recorded in portable exports. */
export interface GenerationProvenance {
  provider: string;
  model: string | null;
}
