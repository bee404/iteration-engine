import { CodeGenGenerationError } from "./errors";
import type { CodeGenProvider, CodeGenRequest } from "./types";

/**
 * Wires the documented Claude Sonnet primary / GPT-4o fallback-on-validation-failure shape
 * (docs/decisions.md, docs/blueprint.md) for streaming code generation, without either branch
 * knowing about the other.
 *
 * Streaming makes this asymmetric with lib/providers/llm/fallback-provider.ts: once
 * `primary.streamCode` has yielded even one token, that token has already reached the client
 * (see app/api/generate/route.ts, which forwards each token as an SSE event as it arrives).
 * There is no way to "un-send" it, so falling back at that point would mean the client
 * receives a second, unrelated generation appended after a truncated one — worse than the
 * typed error alone. Fallback therefore only triggers when the primary fails before yielding
 * any content at all (its `invalid_screenshot` / `model_error` / `unparseable_response` cases,
 * all of which fail before or without ever producing a token). A `truncated_response` failure
 * (which by construction only happens after tokens were already forwarded) always propagates
 * as-is, matching pre-fallback behavior exactly. A non-typed error (a bug, not a modeled
 * failure mode) is never treated as a fallback trigger either.
 *
 * Only constructed by getCodeGenProvider() when OPENAI_API_KEY is set (see ./index.ts); when
 * it's unset, callers get `primary` directly and this class never enters the picture.
 */
export class FallbackCodeGenProvider implements CodeGenProvider {
  readonly name: string;
  readonly language: string;

  constructor(
    private readonly primary: CodeGenProvider,
    private readonly secondary: CodeGenProvider
  ) {
    this.name = `${primary.name}-with-${secondary.name}-fallback`;
    this.language = primary.language;
  }

  async *streamCode(request: CodeGenRequest): AsyncGenerator<string, void, unknown> {
    let yieldedAnyToken = false;
    try {
      for await (const token of this.primary.streamCode(request)) {
        yieldedAnyToken = true;
        yield token;
      }
    } catch (error) {
      if (!(error instanceof CodeGenGenerationError) || yieldedAnyToken) {
        throw error;
      }
      console.warn(
        `[codegen/fallback-provider] ${this.primary.name} streamCode failed (${error.code}) before yielding any tokens; falling back to ${this.secondary.name}.`
      );
      yield* this.secondary.streamCode(request);
    }
  }
}
