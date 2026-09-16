import type {
  Critique,
  Direction,
  GenerationMode,
  GenerationProvenance,
  ImageDimensions,
} from "@/lib/types";

export interface CodeGenRequest {
  direction: Direction;
  designGoal: string;
  feedbackText: string;
  reviewerContext?: string;
  constraints?: string;
  critique: Critique;
  viewport: ImageDimensions | null;
  generationMode: GenerationMode;
  /** Required for apply-design-system; optional for an explicitly requested redesign. */
  designSystemId?: string;
  /** The screenshot this round (and its directions) iterate on — same reference shape as
   * lib/providers/llm's CritiqueRequest.screenshotRef (a browser-uploaded image data URL),
   * so the real provider can ground generated code in what's actually on screen. */
  screenshotRef: string;
}

/**
 * A source of on-demand code/prototype generation for a chosen direction. The real
 * implementation calls Claude Sonnet (primary) / GPT-4o (fallback) and streams the
 * response token-by-token as it arrives. Callers consume `streamCode` as an async
 * generator regardless of which concrete provider is behind it.
 */
export interface CodeGenProvider {
  readonly name: string;
  /** Reflects the backend that most recently completed or attempted this provider's stream. */
  readonly provenance: GenerationProvenance;
  language: string;
  streamCode(request: CodeGenRequest): AsyncGenerator<string, void, unknown>;
}
