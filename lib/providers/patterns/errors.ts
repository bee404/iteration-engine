export type PatternQueryErrorCode = "model_error" | "unparseable_response";

/**
 * Typed failure mode for real (non-mock) pattern grounding, mirroring
 * CritiqueGenerationError/DirectionsGenerationError (lib/providers/llm/errors.ts) so a
 * TwentyFirstProvider failure comes back as a diagnosable typed error instead of an
 * unhandled exception:
 *  - "model_error": the 21st.dev MCP call itself failed (network, auth, rate limit, or a
 *    JSON-RPC / tool-level error envelope).
 *  - "unparseable_response": the MCP server responded successfully but the result didn't
 *    map onto the structured shape the `search` tool documents, even after a retry.
 *
 * Callers (app/api/directions/route.ts) already wrap findPatterns in the same try/catch as
 * direction generation and normalize any error into DirectionsGenerationError, so this type
 * exists for diagnosability (logging, tests) rather than to add a new caller-visible surface.
 */
export class PatternQueryError extends Error {
  readonly code: PatternQueryErrorCode;

  constructor(code: PatternQueryErrorCode, message: string) {
    super(message);
    this.name = "PatternQueryError";
    this.code = code;
  }
}

