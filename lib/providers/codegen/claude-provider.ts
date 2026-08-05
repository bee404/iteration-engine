import type { Direction } from "@/lib/types";
import { CodeGenGenerationError } from "./errors";
import type { CodeGenProvider, CodeGenRequest } from "./types";

const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";
const ANTHROPIC_VERSION = "2023-06-01";
const DEFAULT_MODEL = "claude-sonnet-4-5-20250929";
const MAX_TOKENS = 4096;

type SupportedImageMediaType = "image/png" | "image/jpeg" | "image/gif" | "image/webp";
const SUPPORTED_IMAGE_MEDIA_TYPES: ReadonlySet<string> = new Set([
  "image/png",
  "image/jpeg",
  "image/gif",
  "image/webp",
]);

interface ResolvedImage {
  mediaType: SupportedImageMediaType;
  base64Data: string;
}

/**
 * Resolves screenshotRef into base64 image bytes Claude's vision input can read. Same
 * contract as lib/providers/llm/claude-provider.ts's resolveScreenshot (this step needed
 * its own copy rather than a shared import so this in-flight PR doesn't also touch the
 * already-reviewed critique provider): a data: URL (the browser upload path, see
 * components/upload-form.tsx) or an http(s) URL the server can fetch. A client-only object
 * URL (`blob:...`) can't be dereferenced here, so it's rejected with a non-retryable error.
 */
async function resolveScreenshot(screenshotRef: string): Promise<ResolvedImage> {
  if (screenshotRef.startsWith("data:")) {
    const match = /^data:([^;,]+);base64,(.*)$/s.exec(screenshotRef);
    if (!match) {
      throw new CodeGenGenerationError(
        "invalid_screenshot",
        "screenshotRef is a data URL but is not base64-encoded image data."
      );
    }
    const [, mediaType, base64Data] = match;
    // Both groups are required (non-optional) in the regex above, so a successful match
    // always populates them, but noUncheckedIndexedAccess types the destructure as possibly
    // undefined regardless. Guard explicitly rather than asserting past it.
    if (typeof mediaType !== "string" || typeof base64Data !== "string") {
      throw new CodeGenGenerationError(
        "invalid_screenshot",
        "screenshotRef data URL is missing a media type or base64 payload."
      );
    }
    if (!SUPPORTED_IMAGE_MEDIA_TYPES.has(mediaType)) {
      throw new CodeGenGenerationError(
        "invalid_screenshot",
        `screenshotRef media type "${mediaType}" is not one Claude's vision input supports (png, jpeg, gif, webp).`
      );
    }
    return { mediaType: mediaType as SupportedImageMediaType, base64Data };
  }

  if (screenshotRef.startsWith("http://") || screenshotRef.startsWith("https://")) {
    const response = await fetch(screenshotRef);
    if (!response.ok) {
      throw new CodeGenGenerationError(
        "invalid_screenshot",
        `Could not fetch screenshotRef (${response.status} ${response.statusText}).`
      );
    }
    const contentType = response.headers.get("content-type")?.split(";")[0]?.trim() ?? "";
    const mediaType = SUPPORTED_IMAGE_MEDIA_TYPES.has(contentType)
      ? (contentType as SupportedImageMediaType)
      : "image/png";
    const buffer = await response.arrayBuffer();
    return { mediaType, base64Data: Buffer.from(buffer).toString("base64") };
  }

  throw new CodeGenGenerationError(
    "invalid_screenshot",
    'screenshotRef must be a data: URL or an http(s) URL reachable from the server (a client-only "blob:" object URL cannot be read server-side).'
  );
}

const SYSTEM_PROMPT =
  "You are a senior frontend engineer turning one chosen design direction into a working prototype. " +
  "Write a single, self-contained React functional component (TypeScript, inline styles or one " +
  "<style> block — no external UI library imports, no build step available) that a design tool can " +
  "render directly in a sandboxed preview. Output ONLY the raw source code: no markdown code fences, " +
  "no explanation before or after it.";

/**
 * NOTE (scope gap, flagging rather than inventing a fix): this prompt does not ground generation
 * in the project's design tokens/style guide. docs/blueprint.md and docs/decisions.md describe a
 * planned W3C DTCG token index + condensed style guide as part of the round input model, but
 * lib/types.ts's Round/Project/Direction shapes carry no token or style-guide reference today —
 * there is nothing to thread through without inventing a new loading mechanism out of scope for
 * this change. Direction + screenshot + design goal is the acceptable first pass; once tokens are
 * wired into the round/project data model, add them here as another prompt section.
 */
function buildPrompt(direction: Direction, designGoal: string): string {
  const lines = [
    `Design goal: ${designGoal}`,
    "",
    `Direction to implement: ${direction.title}`,
    `Rationale: ${direction.rationale}`,
    `Tradeoffs: ${direction.tradeoffs}`,
    "",
    "Suggested changes this direction calls for:",
    ...direction.suggestedChanges.map((change) => `- ${change}`),
  ];

  if (direction.patternReference) {
    lines.push(
      "",
      `Ground the structure/pattern in: ${direction.patternReference.name} (${direction.patternReference.source}) — ${direction.patternReference.description}`
    );
  }

  lines.push(
    "",
    "The attached screenshot is the current UI this direction iterates on. Generate a component that " +
      "applies the suggested changes above to what's actually visible in the screenshot, in service of " +
      "the stated design goal and rationale — not a generic template. Reference real elements from the " +
      "screenshot (labels, layout regions, existing components) rather than inventing unrelated content."
  );

  return lines.join("\n");
}

interface AnthropicStreamEvent {
  type: string;
  delta?: { type?: string; text?: string };
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
  }
}

