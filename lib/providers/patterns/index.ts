import type { PatternProvider } from "./types";
import { MockPatternProvider } from "./mock-provider";
import { TwentyFirstProvider } from "./twentyfirst-provider";

export type { PatternProvider, PatternQuery, PatternQueryResult } from "./types";
export type { PatternQueryErrorCode } from "./errors";
export { PatternQueryError } from "./errors";
export { twentyFirstComponentUrl } from "./component-url";

/**
 * Provider factory, mirroring lib/providers/llm and lib/providers/codegen's factory shape.
 *
 * - TWENTYFIRST_API_KEY set -> real live queries against 21st.dev's MCP server
 *   (./twentyfirst-provider.ts), per docs/decisions.md Decision 5.
 * - TWENTYFIRST_API_KEY unset -> typed mock, so local dev without a key still works. This
 *   fallback is a deliberate product decision and must stay intact.
 */
export function getPatternProvider(): PatternProvider {
  const apiKey = process.env.TWENTYFIRST_API_KEY;
  if (apiKey) return new TwentyFirstProvider(apiKey);

  return new MockPatternProvider();
}
