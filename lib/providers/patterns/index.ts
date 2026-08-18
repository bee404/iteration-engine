import type { PatternProvider } from "./types";
import { MockPatternProvider } from "./mock-provider";

export type { PatternProvider, PatternQuery, PatternQueryResult } from "./types";
export { twentyFirstComponentUrl } from "./component-url";

/**
 * Provider factory. Always returns the mock until TWENTYFIRST_API_KEY is configured.
 * Once it is, branch here to a TwentyFirstProvider implementing the same interface —
 * no caller needs to change.
 */
export function getPatternProvider(): PatternProvider {
  return new MockPatternProvider();
}
