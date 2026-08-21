export type CodeGenErrorCode =
  | "invalid_screenshot"
  | "model_error"
  | "unparseable_response"
  | "truncated_response"
  | "internal_error";

/**
 * Typed failure mode for real (non-mock) code generation, mirroring
 * lib/providers/llm/errors.ts's CritiqueGenerationError so this step fails the same way:
 *  - "invalid_screenshot": screenshotRef isn't a reference the provider can read bytes
 *    from (not a data: URL or a fetchable http(s) URL). Not worth retrying.
 *  - "model_error": the upstream Anthropic call itself failed (network, auth, rate limit,
 *    or an `error` event mid-stream).
 *  - "unparseable_response": Claude responded but the stream carried no usable code text.
 *  - "truncated_response": Claude hit the output-token ceiling and stopped mid-file
 *    (stop_reason "max_tokens"), so the component is structurally incomplete — an
 *    unterminated string / unclosed JSX the pre-mount repair stage cannot heal. Surfaced
 *    as its own code so the failure reads as "the model ran out of room," not a mystery
 *    "Unexpected token," and so callers can raise the budget rather than chase a syntax bug.
 *  - "internal_error": anything else — provider misconfiguration (e.g. CODEGEN_PROVIDER=claude
 *    without ANTHROPIC_API_KEY) or a bug the code above didn't anticipate. app/api/generate/route.ts
 *    wraps any error that isn't already one of the codes above in this, specifically so an
 *    unanticipated exception still reaches the client as a typed SSE "error" event instead of
 *    leaving the stream to hang or crash uncaught.
 */
export class CodeGenGenerationError extends Error {
  readonly code: CodeGenErrorCode;

  constructor(code: CodeGenErrorCode, message: string) {
    super(message);
    this.name = "CodeGenGenerationError";
    this.code = code;
  }
}

