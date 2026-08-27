import { CodeGenGenerationError } from "./errors";
import type { GenerationProvenance } from "@/lib/types";
import type { CodeGenProvider, CodeGenRequest } from "./types";
import { buildPrompt, resolveScreenshot, SYSTEM_PROMPT } from "./shared";

const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";
const DEFAULT_MODEL = "gpt-4o";
// Matches ClaudeCodeGenProvider's ceiling (see that file's comment for how 16384 was derived
// from observed dense full-page directions): gpt-4o's own output-token ceiling is 16384, so
// this is the actual maximum, not an arbitrary match.
const MAX_TOKENS = 16384;

interface OpenAIStreamChunk {
  choices?: Array<{
    delta?: { content?: string };
    finish_reason?: string | null;
  }>;
  error?: { message?: string };
}

/**
 * GPT-4o fallback code-generation provider, used only when ClaudeCodeGenProvider's single
 * attempt fails and throws its typed CodeGenGenerationError (see
 * lib/providers/codegen/fallback-provider.ts and ./index.ts) — never as a parallel primary.
 * Streams plain-text tokens the same way ClaudeCodeGenProvider does, so app/api/generate/route.ts
 * and components/direction-card.tsx don't need to know which backend produced them.
 *
 * Prompt construction and implementation requirements are shared with ClaudeCodeGenProvider
 * via ./shared.ts — only the OpenAI streaming transport lives here.
 */
export class OpenAICodeGenProvider implements CodeGenProvider {
  readonly name = "gpt-4o-codegen";
  readonly language = "tsx";

  private readonly apiKey: string;
  private readonly model: string;

  constructor(apiKey: string, model: string = DEFAULT_MODEL) {
    this.apiKey = apiKey;
    this.model = model;
  }

  get provenance(): GenerationProvenance {
    return { provider: "openai", model: this.model };
  }

  async *streamCode(request: CodeGenRequest): AsyncGenerator<string, void, unknown> {
    const { direction, designGoal, screenshotRef } = request;
    const image = await resolveScreenshot(screenshotRef);
    const dataUrl = `data:${image.mediaType};base64,${image.base64Data}`;

    let response: Response;
    try {
      response = await fetch(OPENAI_API_URL, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: this.model,
          max_tokens: MAX_TOKENS,
          stream: true,
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            {
              role: "user",
              content: [
                { type: "text", text: buildPrompt(direction, designGoal) },
                { type: "image_url", image_url: { url: dataUrl } },
              ],
            },
          ],
        }),
      });
    } catch (error) {
      throw new CodeGenGenerationError(
        "model_error",
        `Could not reach the OpenAI API: ${error instanceof Error ? error.message : String(error)}`
      );
    }

    if (!response.ok) {
      const body = await response.text().catch(() => "");
      throw new CodeGenGenerationError(
        "model_error",
        `OpenAI API returned ${response.status} ${response.statusText}: ${body.slice(0, 500)}`
      );
    }
    if (!response.body) {
      throw new CodeGenGenerationError("model_error", "OpenAI API response had no readable body to stream.");
    }

    yield* this.consumeStream(response.body);
  }

  private async *consumeStream(body: ReadableStream<Uint8Array>): AsyncGenerator<string, void, unknown> {
    const reader = body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let sawContent = false;
    let finishReason: string | null | undefined;

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        // SSE frames are separated by a blank line, same framing OpenAI's streaming API uses.
        const frames = buffer.split("\n\n");
        buffer = frames.pop() ?? "";

        for (const frame of frames) {
          const dataLine = frame.split("\n").find((line) => line.startsWith("data: "));
          if (!dataLine) continue;

          const payload = dataLine.slice("data: ".length);
          if (payload === "[DONE]") continue;

          const chunk = JSON.parse(payload) as OpenAIStreamChunk;
          if (chunk.error) {
            throw new CodeGenGenerationError(
              "model_error",
              `OpenAI API streaming error: ${chunk.error.message ?? "unknown error"}`
            );
          }

          const choice = chunk.choices?.[0];
          if (typeof choice?.delta?.content === "string") {
            sawContent = true;
            yield choice.delta.content;
          }
          if (choice?.finish_reason) {
            finishReason = choice.finish_reason;
          }
        }
      }
    } finally {
      reader.releaseLock();
    }

    if (!sawContent) {
      throw new CodeGenGenerationError(
        "unparseable_response",
        "GPT-4o's response contained no text content to stream."
      );
    }

    // "length" is OpenAI's equivalent of Claude's "max_tokens" stop_reason: the component was
    // cut off mid-file, so the accumulated source won't parse. Same typed error as
    // ClaudeCodeGenProvider raises for the analogous case, so a caller can't tell which
    // backend produced it.
    if (finishReason === "length") {
      throw new CodeGenGenerationError(
        "truncated_response",
        "GPT-4o hit the output-token limit and stopped before the component was complete, so the " +
          "generated code is truncated and can't be rendered. Try generating again, or simplify the " +
          "direction so the component fits the budget."
      );
    }
  }
}
