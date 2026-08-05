import type { CodeGenProvider } from "./types";
import { MockCodeGenProvider } from "./mock-provider";

export type { CodeGenProvider, CodeGenRequest } from "./types";

/**
 * Provider factory. Always returns the mock until ANTHROPIC_API_KEY / OPENAI_API_KEY
 * are configured, mirroring lib/providers/llm's factory shape.
 */
export function getCodeGenProvider(): CodeGenProvider {
  return new MockCodeGenProvider();
}
