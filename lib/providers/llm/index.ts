import type { LLMProvider } from "./types";
import { MockLLMProvider } from "./mock-provider";

export type { LLMProvider, CritiqueRequest, CritiqueResult, DirectionsRequest, DirectionsResult } from "./types";

/**
 * Provider factory. Today this always returns the mock, since ANTHROPIC_API_KEY /
 * OPENAI_API_KEY are not configured. Once they are, branch here:
 *
 *   if (process.env.ANTHROPIC_API_KEY) return new ClaudeProvider();
 *   if (process.env.OPENAI_API_KEY) return new OpenAIProvider();
 *   return new MockLLMProvider();
 *
 * No API route or component depends on which branch runs.
 */
export function getLLMProvider(): LLMProvider {
  return new MockLLMProvider();
}
