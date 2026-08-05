export type CritiqueErrorCode = "invalid_screenshot" | "model_error" | "unparseable_response" | "internal_error";

/**
 * Typed failure mode for real (non-mock) critique generation, so callers can respond
 * appropriately instead of letting an unhandled exception crash the request:
 *  - "invalid_screenshot": screenshotRef isn't a reference the provider can read bytes
 *    from (not a data: URL or a fetchable http(s) URL). Not worth retrying.
 *  - "model_error": the upstream API call itself failed (network, auth, rate limit).
 *  - "unparseable_response": the model responded but the content didn't map onto the
 *    typed Critique shape, even after a retry.
 *  - "internal_error": anything else — provider misconfiguration (e.g. LLM_PROVIDER=claude
 *    without ANTHROPIC_API_KEY) or a bug the code above didn't anticipate. The route handler
 *    wraps any error that isn't already one of the codes above in this, specifically so an
 *    unanticipated exception still comes back as a typed JSON error instead of an unhandled
 *    500/502 with no diagnosable body.
 */
export class CritiqueGenerationError extends Error {
  readonly code: CritiqueErrorCode;

  constructor(code: CritiqueErrorCode, message: string) {
    super(message);
    this.name = "CritiqueGenerationError";
    this.code = code;
  }
}

/** HTTP status the API route maps each typed error code to. Centralized here so the
 * mapping travels with the codes it describes instead of living as a ternary in the route. */
export const CRITIQUE_ERROR_STATUS: Record<CritiqueErrorCode, number> = {
  invalid_screenshot: 400,
  model_error: 502,
  unparseable_response: 502,
  internal_error: 500,
};

