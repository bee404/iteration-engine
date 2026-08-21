import { formatDesignSystemForPrompt, getActiveDesignSystem } from "@/lib/design-systems";
import type { Direction } from "@/lib/types";
import { CodeGenGenerationError } from "./errors";
import type { CodeGenProvider, CodeGenRequest } from "./types";

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
 * Enforceable implementation rules the model must follow, appended after the design-system
 * grounding. These are the fixes that a clearer instruction can reliably produce (the
 * deterministic guarantees — fence stripping, off-palette color rewriting, font injection —
 * live in postprocess.ts instead, because they must not depend on model compliance). Each
 * bullet maps to one of the nine issues the raw Test 1 capture needed hand-fixed.
 */
export const IMPLEMENTATION_REQUIREMENTS = [
  "Implementation requirements (these are not style suggestions — treat them as acceptance criteria):",
  "",
  "- Component mapping: render the primary action as the ink-filled primary button and every " +
    "secondary/tertiary action as the ghost-button spec (white fill, 1px hairline border, 6px " +
    "radius). Never render a secondary action as a bare underlined text link.",
  "- Icons: use inline SVG line icons only (~1.5px stroke, fill=\"none\", rounded caps, ink/mute " +
    "grey). Do NOT use emoji or icon-font glyphs anywhere.",
  "- Real interactivity: wire actual React state (useState) and handlers so the prototype " +
    "functions — e.g. completing a step updates state and advances the flow. Do not fake " +
    "interactivity with static markup or no-op handlers.",
  "- Emphasis isolation: when one item is 'the next action', emphasize exactly that single item " +
    "(e.g. compute the first incomplete, unlocked step once and highlight only it). Never apply " +
    "the emphasized treatment to every eligible item at once.",
  "- Sequential numbering: when rendering an ordered set of steps, show explicit 1-based step " +
    "numbers (and/or an 'Step N of M' label) so order is unambiguous.",
  "- Responsive: include real responsive rules for narrow viewports (a <style> block with media " +
    "queries, or equivalent) so the layout stays usable on small screens — do not assume a fixed " +
    "wide desktop width.",
  "- Fonts: reference the design system's self-hosted font family by name; the pipeline guarantees " +
    "the @font-face is loaded, so you do not need to embed font bytes yourself.",
  "- Output raw source only: no markdown code fences, no prose before or after the component. " +
    "The response must be a single valid TSX file that parses on its own — the very first " +
    "character is the first line of code and the very last is the final `}`.",
  "- Syntax that must parse: this code is transpiled and mounted live, so it has to be " +
    "syntactically valid TSX. In inline style objects, every CSS value that carries a unit must " +
    "be a quoted string (`padding: '24px'`, `maxWidth: '480px'`) — never a bare `24px`; only " +
    "unitless numbers may be unquoted (`opacity: 1`, `zIndex: 10`, `lineHeight: 1.5`). If you " +
    "use a `<style>` block, put its CSS inside a template-literal child " +
    "(`` <style>{`.card { color: ... }`}</style> ``), never as raw text between the tags.",
  "- Valid JSX children (the transpiler rejects these and the component won't mount): never put " +
    "a bare object literal in child position \u2014 `<div>{count: 5}</div>` or `<span>{label: value}</span>` " +
    "is NOT a valid child and fails with 'Unexpected token when processing JSX children'. To show a " +
    "computed value, use an expression that evaluates to a string or number " +
    "(`<div>{`Total: ${total}`}</div>` or `<div>{formatPrice(total)}</div>`); to apply inline " +
    "styles, use the double-brace attribute form (`style={{ color: 'red' }}`), never a child. " +
    "Any literal `<` or `>` inside visible text must be escaped or wrapped in an expression " +
    "(`Total {'<'} $50`, `&lt;`, `&gt;`, or `{'> 90% match'}`) \u2014 a bare `Total < $50` or `> 90%` " +
    "in JSX text is a parse error.",
].join("\n");

/**
 * NOTE (scope gap, tracked but not fully closed by this change): generation is now grounded
 * in a design system (lib/design-systems), but there is still exactly one system, hardcoded
 * via getActiveDesignSystem() — not one selected per project/round. docs/blueprint.md and
 * docs/decisions.md describe a planned W3C DTCG token index + condensed style guide as part
 * of the round input model, but lib/types.ts's Round/Project/Direction shapes carry no
 * per-project design-system reference field yet. Building that selection (or a config UI) is
 * out of scope here; this is a proof-of-concept that grounding changes the output at all, with
 * lib/design-systems structured so a different system can replace this one without touching
 * buildPrompt below.
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

  lines.push(
    "",
    "---",
    "",
    "Apply the following design system to every element you generate: colors, type scale, spacing, " +
      "border radius, and named component shapes all come from here, not from your own defaults or " +
      "invented values. Where a Do/Don't below conflicts with something generic you'd otherwise reach " +
      "for, follow the Do/Don't.",
    "",
    formatDesignSystemForPrompt(getActiveDesignSystem())
  );

  lines.push("", "---", "", IMPLEMENTATION_REQUIREMENTS);

  return lines.join("\n");
}

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

