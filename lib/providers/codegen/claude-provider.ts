import { CodeGenGenerationError } from "./errors";
import type { GenerationProvenance } from "@/lib/types";
import type { CodeGenProvider, CodeGenRequest } from "./types";
import { buildPrompt, resolveScreenshot, SYSTEM_PROMPT } from "./shared";

const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";
const ANTHROPIC_VERSION = "2023-06-01";
const DEFAULT_MODEL = "claude-sonnet-4-5-20250929";
// Full-page prototype components run ~4-5k output tokens; the original 4096 cap truncated the
// larger ones mid-file (an unterminated string / unclosed JSX), which the pre-mount repair
// stage can't heal because the closing half was never generated — the live-mount silently fell
// back to read-only source. The 10-round PR #16 QA showed 8192 was still not enough: dense,
// full-page directions (checkout, dense tables, settings, CRM detail) reliably produced ~30k
// characters (~8k tokens) and truncated at the ceiling — reproduced directly, every checkout
// generation hit stop_reason=max_tokens at 8192. 16384 clears those observed dense pages with
// headroom; Sonnet 4.5 supports far higher output natively, so no beta header is needed.
// max_tokens is only a ceiling (billed on tokens actually produced), so raising it costs
// nothing unless a component genuinely needs the room. consumeStream still fails loudly if a
// component ever exceeds even this, and PreviewFrame now always surfaces the fallback banner on
// that (or any other) non-mount — so an over-budget generation is a clear message, never a
// silent stall.
const MAX_TOKENS = 16384;

interface AnthropicStreamEvent {
  type: string;
  // `content_block_delta` carries text; `message_delta` carries the terminal stop_reason
  // ("end_turn" on a clean finish, "max_tokens" when the output ceiling cut the response off).
  delta?: { type?: string; text?: string; stop_reason?: string };
  error?: { type?: string; message?: string };
}

/**
 * Real Claude Sonnet code-generation provider. Sends the direction (title, rationale,
 * tradeoffs, suggested changes, pattern reference) and the round's screenshot as vision
 * input, and streams Claude's plain-text response straight through token-by-token —
 * matching the SSE transport app/api/generate/route.ts and components/direction-card.tsx
 * already expect from MockCodeGenProvider. Unlike the critique provider, there is no
 * retry-on-failure loop here: tokens are forwarded to the client as they arrive, so once
 * streaming has started there is no unsent output to safely retry from.
 *
 * Prompt construction and implementation requirements are shared with OpenAICodeGenProvider
 * via ./shared.ts — only the Anthropic streaming transport lives here.
 */
export class ClaudeCodeGenProvider implements CodeGenProvider {
  readonly name = "claude-codegen";
  readonly language = "tsx";

  private readonly apiKey: string;
  private readonly model: string;

  constructor(apiKey: string, model: string = DEFAULT_MODEL) {
    this.apiKey = apiKey;
    this.model = model;
  }

  get provenance(): GenerationProvenance {
    return { provider: "anthropic", model: this.model };
  }

  async *streamCode(request: CodeGenRequest): AsyncGenerator<string, void, unknown> {
    const { direction, designGoal, screenshotRef } = request;
    const image = await resolveScreenshot(screenshotRef);

    let response: Response;
    try {
      response = await fetch(ANTHROPIC_API_URL, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-api-key": this.apiKey,
          "anthropic-version": ANTHROPIC_VERSION,
        },
        body: JSON.stringify({
          model: this.model,
          max_tokens: MAX_TOKENS,
          stream: true,
          system: SYSTEM_PROMPT,
          messages: [
            {
              role: "user",
              content: [
                { type: "text", text: buildPrompt(direction, designGoal) },
                {
                  type: "image",
                  source: { type: "base64", media_type: image.mediaType, data: image.base64Data },
                },
              ],
            },
          ],
        }),
      });
    } catch (error) {
      throw new CodeGenGenerationError(
        "model_error",
        `Could not reach the Anthropic API: ${error instanceof Error ? error.message : String(error)}`
      );
    }

    if (!response.ok) {
      const body = await response.text().catch(() => "");
      throw new CodeGenGenerationError(
        "model_error",
        `Anthropic API returned ${response.status} ${response.statusText}: ${body.slice(0, 500)}`
      );
    }
    if (!response.body) {
      throw new CodeGenGenerationError("model_error", "Anthropic API response had no readable body to stream.");
    }

    yield* this.consumeStream(response.body);
  }

  private async *consumeStream(body: ReadableStream<Uint8Array>): AsyncGenerator<string, void, unknown> {
    const reader = body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let sawContent = false;
    let stopReason: string | undefined;

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        // SSE frames are separated by a blank line, same framing Anthropic's streaming API and
        // this app's own /api/generate response both use (see components/direction-card.tsx).
        const frames = buffer.split("\n\n");
        buffer = frames.pop() ?? "";

        for (const frame of frames) {
          const dataLine = frame.split("\n").find((line) => line.startsWith("data: "));
          if (!dataLine) continue;

          const event = JSON.parse(dataLine.slice("data: ".length)) as AnthropicStreamEvent;

          if (
            event.type === "content_block_delta" &&
            event.delta?.type === "text_delta" &&
            typeof event.delta.text === "string"
          ) {
            sawContent = true;
            yield event.delta.text;
          } else if (event.type === "message_delta" && typeof event.delta?.stop_reason === "string") {
            stopReason = event.delta.stop_reason;
          } else if (event.type === "error") {
            throw new CodeGenGenerationError(
              "model_error",
              `Anthropic API streaming error: ${event.error?.message ?? "unknown error"}`
            );
          }
        }
      }
    } finally {
      reader.releaseLock();
    }

    if (!sawContent) {
      throw new CodeGenGenerationError(
        "unparseable_response",
        "Claude's response contained no text content to stream."
      );
    }

    // A "max_tokens" stop means the component was cut off mid-file: the tokens already
    // streamed are real but incomplete, so the accumulated source won't parse and the
    // pre-mount repair stage has nothing valid to heal. Fail loudly with a typed error
    // rather than let the client mount a truncated component and report a mystery
    // "Unexpected token." MAX_TOKENS was raised to make this rare; this keeps it honest
    // if a component ever exceeds even the higher ceiling.
    if (stopReason === "max_tokens") {
      throw new CodeGenGenerationError(
        "truncated_response",
        "Claude hit the output-token limit and stopped before the component was complete, so the " +
          "generated code is truncated and can't be rendered. Try generating again, or simplify the " +
          "direction so the component fits the budget."
      );
    }
  }
}
