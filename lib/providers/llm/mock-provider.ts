import { randomUUID } from "node:crypto";
import type {
  CritiqueRequest,
  CritiqueResult,
  DirectionsRequest,
  DirectionsResult,
  LLMProvider,
} from "./types";

/**
 * Typed mock standing in for the real Claude Sonnet / GPT-4o call. No API key is
 * configured yet, so this returns deterministic, realistic-shaped data so the
 * critique/directions endpoints and UI are fully wireable end to end. Replace
 * with a ClaudeProvider (primary) + OpenAIProvider (fallback on validation
 * failure) behind the same LLMProvider interface once ANTHROPIC_API_KEY /
 * OPENAI_API_KEY are configured — no caller needs to change.
 */
export class MockLLMProvider implements LLMProvider {
  readonly name = "mock-llm";

  async generateCritique(request: CritiqueRequest): Promise<CritiqueResult> {
    const { designGoal, feedbackText, reviewerContext } = request;

    return {
      critique: {
        summary: `Mock critique against the goal "${designGoal}". Feedback centers on hierarchy and clarity; the layout mostly supports the stated goal but has a few concrete friction points worth fixing before exploring style changes.`,
        signal: [
          { kind: "signal", text: "Primary action competes visually with secondary actions in the current layout." },
          { kind: "signal", text: "Feedback text does not map to an established interaction pattern for this screen." },
        ],
        preference: [
          { kind: "preference", text: "Requested color adjustment reads as taste rather than a usability problem." },
        ],
        flaggedAmbiguities: feedbackText.length < 40
          ? ["Feedback is short — consider clarifying which element the critique should prioritize."]
          : [],
        model: this.name,
      },
    };
    void reviewerContext;
  }

  async generateDirections(request: DirectionsRequest): Promise<DirectionsResult> {
    const { designGoal, patternReferences } = request;
    const titles = ["Consolidate hierarchy", "Progressive disclosure", "Reframe the entry point"];

    const directions = titles.map((title, index) => ({
      id: randomUUID(),
      title: `${title}`,
      rationale: `Addresses "${designGoal}" by restructuring how the primary and secondary actions are surfaced, directly responding to the signal items in the critique rather than a cosmetic pass.`,
      tradeoffs: index === 0
        ? "Higher visual density; may need a follow-up pass on spacing."
        : index === 1
        ? "Adds an interaction step; reduces upfront complexity at the cost of an extra click."
        : "Larger structural change; higher implementation cost, higher potential upside.",
      suggestedChanges: [
        "Re-order primary vs. secondary actions by task frequency.",
        "Tighten the visual weight difference between calls to action.",
        "Apply the referenced pattern's spacing rhythm where structurally compatible.",
      ],
      patternReference: patternReferences[index] ?? null,
    }));

    return { directions };
  }
}
