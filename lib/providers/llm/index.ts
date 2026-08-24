import { isDemoMode } from "@/lib/demo-mode";
import { ClaudeLLMProvider } from "./claude-provider";
import { CritiqueGenerationError } from "./errors";
import { FallbackLLMProvider } from "./fallback-provider";
import { FixtureLLMProvider } from "./fixture-provider";
import { MockLLMProvider } from "./mock-provider";
import { OpenAILLMProvider } from "./openai-provider";
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
 * - ANTHROPIC_API_KEY set AND OPENAI_API_KEY set -> Claude wrapped in FallbackLLMProvider, so a
 *   Claude failure that survives its own retries (a thrown CritiqueGenerationError /
 *   DirectionsGenerationError) falls through to OpenAILLMProvider (GPT-4o) instead of
 *   surfacing to the caller — the documented Claude-primary/GPT-4o-fallback shape
 *   (docs/decisions.md, docs/blueprint.md). OPENAI_API_KEY unset -> ClaudeLLMProvider is
 *   returned bare, exactly as before this fallback existed: no wrapper, no behavior change.
 */
export function getLLMProvider(): LLMProvider {
  // DEMO_MODE wins over every other selector so the live path is fully bypassed regardless of
  // ANTHROPIC_API_KEY / LLM_PROVIDER. See lib/demo-mode.ts.
  if (isDemoMode()) return new FixtureLLMProvider();

  const override = process.env.LLM_PROVIDER?.trim().toLowerCase();
  if (override === "mock") return new MockLLMProvider();

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (apiKey) {
    const claude = new ClaudeLLMProvider(apiKey);
    const openaiApiKey = process.env.OPENAI_API_KEY;
    return openaiApiKey ? new FallbackLLMProvider(claude, new OpenAILLMProvider(openaiApiKey)) : claude;
  }

  if (override === "claude") {
    throw new Error("LLM_PROVIDER=claude was set but ANTHROPIC_API_KEY is missing.");
  }

  return new MockLLMProvider();
}
