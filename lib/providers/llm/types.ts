import type { Critique, Direction, PatternReference } from "@/lib/types";

export interface CritiqueRequest {
  screenshotRef: string;
  designGoal: string;
  feedbackText: string;
  reviewerContext?: string;
  constraints?: string;
}

export interface CritiqueResult {
  critique: Critique;
}

export interface DirectionsRequest {
  critique: Critique;
  designGoal: string;
  feedbackText: string;
  constraints?: string;
  /** Grounding references already fetched from the pattern provider, if any. */
  patternReferences: PatternReference[];
}

export interface DirectionsResult {
  directions: Direction[];
}

/**
 * A model backend capable of producing a critique and a set of directions.
 * Swap in a real implementation (Claude Sonnet primary, GPT-4o fallback on
 * validation failure) by implementing this interface and wiring it up in
 * `./index.ts` — the API routes never call a concrete provider directly.
 */
export interface LLMProvider {
  readonly name: string;
  generateCritique(request: CritiqueRequest): Promise<CritiqueResult>;
  generateDirections(request: DirectionsRequest): Promise<DirectionsResult>;
}
