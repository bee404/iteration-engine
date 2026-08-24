import { CritiqueGenerationError, DirectionsGenerationError } from "./errors";
import type { CritiqueRequest, CritiqueResult, DirectionsRequest, DirectionsResult, LLMProvider } from "./types";

/**
 * Wires the documented Claude Sonnet primary / GPT-4o fallback-on-validation-failure shape
 * (docs/decisions.md, docs/blueprint.md) without either branch knowing about the other:
 * `primary` runs first and its typed error is only reached after it has exhausted its own
 * internal retries (see ClaudeLLMProvider.MAX_ATTEMPTS) — this wrapper does not add a second
 * layer of retrying, it substitutes a different backend once the first is provably out of
 * options. A non-typed error (a bug, not a modeled failure mode) is never treated as a
 * fallback trigger and propagates immediately, same as if this wrapper weren't here.
 *
 * Only constructed by getLLMProvider() when OPENAI_API_KEY is set (see ./index.ts); when it's
 * unset, callers get `primary` directly and this class never enters the picture.
 */
export class FallbackLLMProvider implements LLMProvider {
  readonly name: string;

  constructor(
    private readonly primary: LLMProvider,
    private readonly secondary: LLMProvider
  ) {
    this.name = `${primary.name}-with-${secondary.name}-fallback`;
  }

  async generateCritique(request: CritiqueRequest): Promise<CritiqueResult> {
    try {
      return await this.primary.generateCritique(request);
    } catch (error) {
      if (!(error instanceof CritiqueGenerationError)) throw error;
      console.warn(
        `[llm/fallback-provider] ${this.primary.name} critique generation failed (${error.code}); falling back to ${this.secondary.name}.`
      );
      return this.secondary.generateCritique(request);
    }
  }

  async generateDirections(request: DirectionsRequest): Promise<DirectionsResult> {
    try {
      return await this.primary.generateDirections(request);
    } catch (error) {
      if (!(error instanceof DirectionsGenerationError)) throw error;
      console.warn(
        `[llm/fallback-provider] ${this.primary.name} directions generation failed (${error.code}); falling back to ${this.secondary.name}.`
      );
      return this.secondary.generateDirections(request);
    }
  }
}
