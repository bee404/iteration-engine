import { isDemoMode } from "@/lib/demo-mode";
import { ClaudeLLMProvider } from "./claude-provider";
import { CritiqueGenerationError } from "./errors";
import { FixtureLLMProvider } from "./fixture-provider";
import { MockLLMProvider } from "./mock-provider";
import type { LLMProvider } from "./types";

export type { LLMProvider, CritiqueRequest, CritiqueResult, DirectionsRequest, DirectionsResult } from "./types";
export type { CritiqueErrorCode, DirectionsErrorCode } from "./errors";
export {
  CRITIQUE_ERROR_STATUS,
  CritiqueGenerationError,
  DIRECTIONS_ERROR_STATUS,
  DirectionsGenerationError,
} from "./errors";

/**
 * Provider factory.
 *
 * - ANTHROPIC_API_KEY set -> real Claude Sonnet critiques AND directions (lib/providers/llm/claude-provider.ts).
 * - ANTHROPIC_API_KEY unset -> typed mock, so local dev without a key still works. This
 *   fallback is a deliberate product decision (docs/decisions.md) and must stay intact.
 * - LLM_PROVIDER=mock forces the mock even when a key is configured (useful for local dev
 *   without burning real API calls). LLM_PROVIDER=claude without a key is a misconfiguration
 *   and fails loudly rather than silently falling back.
 *
 * OpenAI fallback-on-validation-failure (docs/decisions.md) is not wired yet; only the
 * Claude branch is implemented today. No API route or component depends on which branch runs.
 */
export function getLLMProvider(): LLMProvider {
  // DEMO_MODE wins over every other selector so the live path is fully bypassed regardless of
  // ANTHROPIC_API_KEY / LLM_PROVIDER. See lib/demo-mode.ts.
  if (isDemoMode()) return new FixtureLLMProvider();

  const override = process.env.LLM_PROVIDER?.trim().toLowerCase();
  if (override === "mock") return new MockLLMProvider();

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (apiKey) return new ClaudeLLMProvider(apiKey);

  if (override === "claude") {
    throw new Error("LLM_PROVIDER=claude was set but ANTHROPIC_API_KEY is missing.");
  }

  return new MockLLMProvider();
}
