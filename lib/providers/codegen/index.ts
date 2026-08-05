import { ClaudeCodeGenProvider } from "./claude-provider";
import type { CodeGenProvider } from "./types";
import { MockCodeGenProvider } from "./mock-provider";

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
 */
export function getCodeGenProvider(): CodeGenProvider {
  const override = process.env.CODEGEN_PROVIDER?.trim().toLowerCase();
  if (override === "mock") return new MockCodeGenProvider();

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (apiKey) return new ClaudeCodeGenProvider(apiKey);

  if (override === "claude") {
    throw new Error("CODEGEN_PROVIDER=claude was set but ANTHROPIC_API_KEY is missing.");
  }

  return new MockCodeGenProvider();
}
