import { isDemoMode } from "@/lib/demo-mode";
import { ClaudeCodeGenProvider } from "./claude-provider";
import type { CodeGenProvider } from "./types";
import { FallbackCodeGenProvider } from "./fallback-provider";
import { FixtureCodeGenProvider } from "./fixture-provider";
import { MockCodeGenProvider } from "./mock-provider";
import { OpenAICodeGenProvider } from "./openai-provider";

export type { CodeGenProvider, CodeGenRequest } from "./types";
export type { CodeGenErrorCode } from "./errors";
export { CodeGenGenerationError } from "./errors";

/**
 * Provider factory, mirroring lib/providers/llm's factory shape.
 *
 * - ANTHROPIC_API_KEY set -> real Claude Sonnet code generation (./claude-provider.ts).
 * - ANTHROPIC_API_KEY unset -> typed mock, so local dev without a key still works.
 * - CODEGEN_PROVIDER=mock forces the mock even when a key is configured (useful for local dev
 *   without burning real API calls).
 * - CODEGEN_PROVIDER=claude without a key is a misconfiguration and fails loudly rather than
 *   silently falling back.
 *
 * - ANTHROPIC_API_KEY set AND OPENAI_API_KEY set -> Claude wrapped in FallbackCodeGenProvider,
 *   so a Claude streamCode failure that happens before any token was yielded (a thrown
 *   CodeGenGenerationError) falls through to OpenAICodeGenProvider (GPT-4o) instead of
 *   surfacing to the caller — the documented Claude-primary/GPT-4o-fallback shape
 *   (docs/decisions.md, docs/blueprint.md). A failure after tokens were already streamed
 *   (truncated_response) always surfaces as-is; see fallback-provider.ts for why. OPENAI_API_KEY
 *   unset -> ClaudeCodeGenProvider is returned bare, exactly as before this fallback existed:
 *   no wrapper, no behavior change.
 */
export function getCodeGenProvider(): CodeGenProvider {
  // DEMO_MODE wins over every other selector so the live path is fully bypassed regardless of
  // ANTHROPIC_API_KEY / CODEGEN_PROVIDER. See lib/demo-mode.ts.
  if (isDemoMode()) return new FixtureCodeGenProvider();

  const override = process.env.CODEGEN_PROVIDER?.trim().toLowerCase();
  if (override === "mock") return new MockCodeGenProvider();

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (apiKey) {
    const claude = new ClaudeCodeGenProvider(apiKey);
    const openaiApiKey = process.env.OPENAI_API_KEY;
    return openaiApiKey ? new FallbackCodeGenProvider(claude, new OpenAICodeGenProvider(openaiApiKey)) : claude;
  }

  if (override === "claude") {
    throw new Error("CODEGEN_PROVIDER=claude was set but ANTHROPIC_API_KEY is missing.");
  }

  return new MockCodeGenProvider();
}
