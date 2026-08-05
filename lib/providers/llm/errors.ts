export type CritiqueErrorCode = "invalid_screenshot" | "model_error" | "unparseable_response";

/**
 * Typed failure mode for real (non-mock) critique generation, so callers can respond
 * appropriately instead of letting an unhandled exception crash the request:
 *  - "invalid_screenshot": screenshotRef isn't a reference the provider can read bytes
 *    from (not a data: URL or a fetchable http(s) URL). Not worth retrying.
 *  - "model_error": the upstream API call itself failed (network, auth, rate limit).
 *  - "unparseable_response": the model responded but the content didn't map onto the
 *    typed Critique shape, even after a retry.
 */
export class CritiqueGenerationError extends Error {
  readonly code: CritiqueErrorCode;

  constructor(code: CritiqueErrorCode, message: string) {
    super(message);
    this.name = "CritiqueGenerationError";
    this.code = code;
  }
}

