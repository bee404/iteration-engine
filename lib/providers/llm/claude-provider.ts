import type { Critique, SignalPreferenceItem } from "@/lib/types";
import { CritiqueGenerationError } from "./errors";
import { MockLLMProvider } from "./mock-provider";
import type { CritiqueRequest, CritiqueResult, DirectionsRequest, DirectionsResult, LLMProvider } from "./types";

const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";
const ANTHROPIC_VERSION = "2023-06-01";
const DEFAULT_MODEL = "claude-sonnet-4-5-20250929";
/** One retry on a failed or unparseable response, per the product decision to surface a
 * typed error rather than crash instead of retrying indefinitely. */
const MAX_ATTEMPTS = 2;

const SUBMIT_CRITIQUE_TOOL = "submit_critique";

/**
 * Forcing this tool via tool_choice makes Claude return the critique as validated JSON
 * instead of free-form prose, which is most of what "parsing the response" would
 * otherwise have to guard against. `kind` is deliberately not part of the schema: it's
 * derived from which array an item is in (see `toItems`) so a mislabeled field from the
 * model can never desync signal/preference from their stated meaning.
 */
const critiqueTool = {
  name: SUBMIT_CRITIQUE_TOOL,
  description:
    "Submit the structured design critique for this screenshot: a short summary, the signal items (real, actionable problems relative to the stated design goal), the preference items (personal taste that doesn't need to be acted on), and any parts of the feedback too vague to act on without clarification.",
  input_schema: {
    type: "object",
    properties: {
      summary: {
        type: "string",
        description:
          "2-4 sentence synthesis of how well the screenshot serves the stated design goal, informed by the feedback.",
      },
      signal: {
        type: "array",
        items: {
          type: "object",
          properties: { text: { type: "string" } },
          required: ["text"],
        },
        description:
          "Concrete, actionable problems relative to the stated design goal, grounded in what is actually visible in the screenshot.",
      },
      preference: {
        type: "array",
        items: {
          type: "object",
          properties: { text: { type: "string" } },
          required: ["text"],
        },
        description: "Personal taste opinions present in the feedback that are not required fixes.",
      },
      flaggedAmbiguities: {
        type: "array",
        items: { type: "string" },
        description: "Portions of the raw feedback too vague to act on without clarification.",
      },
    },
    required: ["summary", "signal", "preference", "flaggedAmbiguities"],
  },
} as const;

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
 * Resolves screenshotRef into base64 image bytes Claude's vision input can read.
 * Accepts a data: URL (the browser upload path, see components/upload-form.tsx) or an
 * http(s) URL the server can fetch. A client-only object URL (`blob:...`) can't be
 * dereferenced here, so it's rejected with a clear, non-retryable error.
 */
async function resolveScreenshot(screenshotRef: string): Promise<ResolvedImage> {
  if (screenshotRef.startsWith("data:")) {
    const match = /^data:([^;,]+);base64,(.*)$/s.exec(screenshotRef);
    if (!match) {
      throw new CritiqueGenerationError(
        "invalid_screenshot",
        "screenshotRef is a data URL but is not base64-encoded image data."
      );
    }
    const [, mediaType, base64Data] = match;
    if (!SUPPORTED_IMAGE_MEDIA_TYPES.has(mediaType)) {
      throw new CritiqueGenerationError(
        "invalid_screenshot",
        `screenshotRef media type "${mediaType}" is not one Claude's vision input supports (png, jpeg, gif, webp).`
      );
    }
    return { mediaType: mediaType as SupportedImageMediaType, base64Data };
  }

  if (screenshotRef.startsWith("http://") || screenshotRef.startsWith("https://")) {
    const response = await fetch(screenshotRef);
    if (!response.ok) {
      throw new CritiqueGenerationError(
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

  throw new CritiqueGenerationError(
    "invalid_screenshot",
    'screenshotRef must be a data: URL or an http(s) URL reachable from the server (a client-only "blob:" object URL cannot be read server-side).'
  );
}

function buildPrompt(request: CritiqueRequest): string {
  const { designGoal, feedbackText, reviewerContext, constraints } = request;
  const lines = [
    `Design goal: ${designGoal}`,
    "",
    "Raw stakeholder feedback (verbatim, may include vague or contradictory notes):",
    feedbackText,
  ];
  if (reviewerContext) {
    lines.push("", `Reviewer context: ${reviewerContext}`);
  }
  if (constraints) {
    lines.push("", `Constraints the critique must respect: ${constraints}`);
  }
  lines.push(
    "",
    "Look at the attached screenshot and critique it against the stated design goal and feedback. Separate concrete, actionable problems relative to the goal (signal) from opinions that are personal taste and don't need to be acted on (preference). Reference specific elements visible in the screenshot rather than restating the feedback verbatim. Call the submit_critique tool with your structured answer."
  );
  return lines.join("\n");
}

function toItems(kind: SignalPreferenceItem["kind"], values: unknown): SignalPreferenceItem[] {
  if (!Array.isArray(values)) {
    throw new CritiqueGenerationError("unparseable_response", `Expected "${kind}" to be an array in Claude's response.`);
  }
  return values.map((value, index) => {
    if (!value || typeof value !== "object" || typeof (value as { text?: unknown }).text !== "string") {
      throw new CritiqueGenerationError("unparseable_response", `"${kind}[${index}]" is missing a string "text" field.`);
    }
    return { kind, text: (value as { text: string }).text };
  });
}

function parseToolInput(input: unknown, model: string): Critique {
  if (!input || typeof input !== "object") {
    throw new CritiqueGenerationError("unparseable_response", "Claude's tool_use input was not an object.");
  }
  const record = input as Record<string, unknown>;
  if (typeof record.summary !== "string" || !record.summary.trim()) {
    throw new CritiqueGenerationError("unparseable_response", 'Claude\'s response is missing a non-empty "summary".');
  }
  if (!Array.isArray(record.flaggedAmbiguities) || !record.flaggedAmbiguities.every((item) => typeof item === "string")) {
    throw new CritiqueGenerationError(
      "unparseable_response",
      '"flaggedAmbiguities" in Claude\'s response must be an array of strings.'
    );
  }

  return {
    summary: record.summary,
    signal: toItems("signal", record.signal),
    preference: toItems("preference", record.preference),
    flaggedAmbiguities: record.flaggedAmbiguities as string[],
    model,
  };
}

interface AnthropicContentBlock {
  type: string;
  text?: string;
  id?: string;
  name?: string;
  input?: unknown;
}

interface AnthropicMessageResponse {
  content: AnthropicContentBlock[];
  stop_reason: string;
}

/**
 * Real Claude Sonnet critique provider. Sends the screenshot as vision input alongside
 * the stated design goal and raw feedback text, and forces a structured tool-call
 * response so the output maps directly onto the typed `Critique` shape the rest of the
 * app already expects. `generateDirections` intentionally stays on the mock — wiring
 * real directions generation is out of scope for this change (see docs/decisions.md).
 */
export class ClaudeLLMProvider implements LLMProvider {
  readonly name = "claude-sonnet";

  private readonly apiKey: string;
  private readonly model: string;
  private readonly directionsFallback = new MockLLMProvider();

  constructor(apiKey: string, model: string = DEFAULT_MODEL) {
    this.apiKey = apiKey;
    this.model = model;
  }

  async generateCritique(request: CritiqueRequest): Promise<CritiqueResult> {
    let lastError: unknown;
    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      try {
        const critique = await this.requestCritique(request);
        return { critique };
      } catch (error) {
        lastError = error;
        // Not a parsing/transient failure — retrying the same unreadable input won't help.
        if (error instanceof CritiqueGenerationError && error.code === "invalid_screenshot") {
          throw error;
        }
      }
    }
    if (lastError instanceof CritiqueGenerationError) throw lastError;
    throw new CritiqueGenerationError(
      "model_error",
      `Claude critique generation failed after ${MAX_ATTEMPTS} attempts: ${
        lastError instanceof Error ? lastError.message : String(lastError)
      }`
    );
  }

  async generateDirections(request: DirectionsRequest): Promise<DirectionsResult> {
    return this.directionsFallback.generateDirections(request);
  }

  private async requestCritique(request: CritiqueRequest): Promise<Critique> {
    const image = await resolveScreenshot(request.screenshotRef);

    const response = await fetch(ANTHROPIC_API_URL, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": this.apiKey,
        "anthropic-version": ANTHROPIC_VERSION,
      },
      body: JSON.stringify({
        model: this.model,
        max_tokens: 2048,
        system:
          "You are a senior product design critic. You separate real, actionable problems (signal) from personal taste (preference) when reviewing a UI screenshot against a stated design goal and stakeholder feedback. You are specific and reference what is actually visible in the screenshot; you never simply restate the feedback verbatim.",
        tools: [critiqueTool],
        tool_choice: { type: "tool", name: SUBMIT_CRITIQUE_TOOL },
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: buildPrompt(request) },
              {
                type: "image",
                source: { type: "base64", media_type: image.mediaType, data: image.base64Data },
              },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      const body = await response.text().catch(() => "");
      throw new CritiqueGenerationError(
        "model_error",
        `Anthropic API returned ${response.status} ${response.statusText}: ${body.slice(0, 500)}`
      );
    }

    const payload = (await response.json()) as AnthropicMessageResponse;
    const toolUse = payload.content.find((block) => block.type === "tool_use" && block.name === SUBMIT_CRITIQUE_TOOL);
    if (!toolUse) {
      throw new CritiqueGenerationError(
        "unparseable_response",
        `Claude did not call ${SUBMIT_CRITIQUE_TOOL} (stop_reason: ${payload.stop_reason}).`
      );
    }

    return parseToolInput(toolUse.input, this.name);
  }
}

