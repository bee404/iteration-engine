import { randomUUID } from "node:crypto";
import type { Critique, Direction, PatternReference, SignalPreferenceItem } from "@/lib/types";
import { CritiqueGenerationError, DirectionsGenerationError } from "./errors";
import type { CritiqueRequest, CritiqueResult, DirectionsRequest, DirectionsResult, LLMProvider } from "./types";

const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";
const ANTHROPIC_VERSION = "2023-06-01";
const DEFAULT_MODEL = "claude-sonnet-4-5-20250929";
/** One retry on a failed or unparseable response, per the product decision to surface a
 * typed error rather than crash instead of retrying indefinitely. */
const MAX_ATTEMPTS = 2;

const SUBMIT_CRITIQUE_TOOL = "submit_critique";
const SUBMIT_DIRECTIONS_TOOL = "submit_directions";
/** The product produces 3 directions to compare per round (docs/decisions.md, Decision 2).
 * Enforced on the model's output so a round always offers the same number of options. */
const REQUIRED_DIRECTIONS = 3;

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

/**
 * Forcing this tool makes Claude return the directions as validated JSON rather than prose.
 * `id` and `patternReference` are deliberately NOT in the schema: `id` is minted server-side
 * (a model-supplied id can't be trusted to be unique/stable), and each direction is grounded
 * in the pre-fetched pattern reference at its index (see `toDirections`) so the model can't
 * invent a `21st.dev` URL that was never actually returned by the pattern provider.
 *
 * The description leans hard on distinctness because the defect this replaces was a mock that
 * returned three titles wrapping one identical rationale/suggestedChanges body — three options
 * that read as the same idea. Each direction must be a genuinely different strategic approach.
 */
const directionsTool = {
  name: SUBMIT_DIRECTIONS_TOOL,
  description:
    `Submit exactly ${REQUIRED_DIRECTIONS} genuinely distinct design directions for this round. Each direction must be a different strategic approach to the problem — not the same idea reworded. They should differ in their core move (e.g. restructure information hierarchy vs. change the interaction model vs. reframe the primary task), in their rationale, in their tradeoffs, and in their concrete suggested changes. Two directions that share the same rationale or the same suggested changes are a failure.`,
  input_schema: {
    type: "object",
    properties: {
      directions: {
        type: "array",
        minItems: REQUIRED_DIRECTIONS,
        maxItems: REQUIRED_DIRECTIONS,
        items: {
          type: "object",
          properties: {
            title: {
              type: "string",
              description: "Short, distinct label for the strategic approach (e.g. \"Consolidate the action bar\").",
            },
            rationale: {
              type: "string",
              description:
                "2-4 sentences on why this approach serves the stated design goal and which specific signal items from the critique it addresses. Must be specific to THIS approach, not reusable across the other directions.",
            },
            tradeoffs: {
              type: "string",
              description: "What this approach costs or risks relative to the alternatives (effort, added interaction steps, density, etc.).",
            },
            suggestedChanges: {
              type: "array",
              minItems: 1,
              items: { type: "string" },
              description: "Concrete, actionable changes specific to this approach. Do not repeat the same list across directions.",
            },
          },
          required: ["title", "rationale", "tradeoffs", "suggestedChanges"],
        },
        description: `Exactly ${REQUIRED_DIRECTIONS} substantively different directions.`,
      },
    },
    required: ["directions"],
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
    // Both groups are required (non-optional) in the regex above, so a successful match
    // always populates them — but noUncheckedIndexedAccess types array destructuring as
    // possibly-undefined regardless. Guard explicitly rather than asserting past it: an
    // undefined capture here means the input didn't actually match the shape we expect.
    if (typeof mediaType !== "string" || typeof base64Data !== "string") {
      throw new CritiqueGenerationError(
        "invalid_screenshot",
        "screenshotRef data URL is missing a media type or base64 payload."
      );
    }
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

function buildDirectionsPrompt(request: DirectionsRequest): string {
  const { critique, designGoal, feedbackText, constraints, patternReferences } = request;
  const signal = critique.signal.map((item, index) => `${index + 1}. ${item.text}`).join("\n");

  const lines = [
    `Design goal: ${designGoal}`,
    "",
    "Raw stakeholder feedback (verbatim):",
    feedbackText,
    "",
    "Critique summary:",
    critique.summary,
    "",
    "Signal items (the real, actionable problems the directions must address):",
    signal || "(none surfaced)",
  ];

  if (critique.preference.length > 0) {
    lines.push(
      "",
      "Preference items (personal taste — do NOT design directions around these):",
      critique.preference.map((item, index) => `${index + 1}. ${item.text}`).join("\n")
    );
  }

  if (constraints) {
    lines.push("", `Constraints every direction must respect: ${constraints}`);
  }

  if (patternReferences.length > 0) {
    // Grounding: the directions are matched to these references by position, so listing them
    // in order lets the model tailor each rationale to the pattern it will actually carry.
    const refs = patternReferences
      .map((ref, index) => `${index + 1}. ${ref.name} (${ref.source}) — ${ref.description}`)
      .join("\n");
    lines.push(
      "",
      "Grounding pattern references (direction N will be paired with reference N where one exists):",
      refs
    );
  }

  lines.push(
    "",
    `Produce exactly ${REQUIRED_DIRECTIONS} genuinely distinct directions that resolve the signal items above. Each must take a materially different strategic approach — different core move, rationale, tradeoffs, and suggested changes. Do not offer the same idea under three titles. Call the ${SUBMIT_DIRECTIONS_TOOL} tool with your structured answer.`
  );
  return lines.join("\n");
}

function toDirections(input: unknown, patternReferences: PatternReference[]): Direction[] {
  if (!input || typeof input !== "object") {
    throw new DirectionsGenerationError("unparseable_response", "Claude's tool_use input was not an object.");
  }
  const { directions } = input as { directions?: unknown };
  if (!Array.isArray(directions)) {
    throw new DirectionsGenerationError("unparseable_response", 'Claude\'s response is missing a "directions" array.');
  }
  if (directions.length !== REQUIRED_DIRECTIONS) {
    throw new DirectionsGenerationError(
      "unparseable_response",
      `Expected exactly ${REQUIRED_DIRECTIONS} directions but Claude returned ${directions.length}.`
    );
  }

  const parsed = directions.map((value, index): Direction => {
    if (!value || typeof value !== "object") {
      throw new DirectionsGenerationError("unparseable_response", `directions[${index}] is not an object.`);
    }
    const record = value as Record<string, unknown>;
    const { title, rationale, tradeoffs, suggestedChanges } = record;
    if (typeof title !== "string" || !title.trim()) {
      throw new DirectionsGenerationError("unparseable_response", `directions[${index}] is missing a non-empty "title".`);
    }
    if (typeof rationale !== "string" || !rationale.trim()) {
      throw new DirectionsGenerationError(
        "unparseable_response",
        `directions[${index}] is missing a non-empty "rationale".`
      );
    }
    if (typeof tradeoffs !== "string" || !tradeoffs.trim()) {
      throw new DirectionsGenerationError(
        "unparseable_response",
        `directions[${index}] is missing a non-empty "tradeoffs".`
      );
    }
    if (
      !Array.isArray(suggestedChanges) ||
      suggestedChanges.length === 0 ||
      !suggestedChanges.every((change) => typeof change === "string" && change.trim())
    ) {
      throw new DirectionsGenerationError(
        "unparseable_response",
        `directions[${index}].suggestedChanges must be a non-empty array of non-empty strings.`
      );
    }

    return {
      id: randomUUID(),
      title,
      rationale,
      tradeoffs,
      suggestedChanges: suggestedChanges as string[],
      // Pair each direction with the pattern reference at its position; null when the pattern
      // provider returned fewer references than directions.
      patternReference: patternReferences[index] ?? null,
    };
  });

  assertDistinct(parsed);
  return parsed;
}

/**
 * Guards against the exact defect this change fixes: three "options" that are the same idea
 * wearing different titles. If any two directions share an identical rationale, or an identical
 * set of suggested changes, the output isn't offering a real choice — treat it as unparseable
 * so the retry (and ultimately a typed error) kicks in rather than shipping duplicates.
 */
function assertDistinct(directions: Direction[]): void {
  const seenRationales = new Set<string>();
  const seenChangeSets = new Set<string>();
  for (const direction of directions) {
    const rationaleKey = direction.rationale.trim().toLowerCase();
    const changesKey = direction.suggestedChanges.map((c) => c.trim().toLowerCase()).join("\u0000");
    if (seenRationales.has(rationaleKey) || seenChangeSets.has(changesKey)) {
      throw new DirectionsGenerationError(
        "unparseable_response",
        "Claude returned directions that share an identical rationale or suggested-changes list; they are not substantively distinct."
      );
    }
    seenRationales.add(rationaleKey);
    seenChangeSets.add(changesKey);
  }
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
 * app already expects. `generateDirections` is wired to real Claude Sonnet the same way:
 * it forces a structured tool call and validates the output onto the typed `Direction[]`
 * shape, including a distinctness guard so the round always offers genuinely different
 * options (see docs/decisions.md, Decision 2).
 */
export class ClaudeLLMProvider implements LLMProvider {
  readonly name = "claude-sonnet";

  private readonly apiKey: string;
  private readonly model: string;

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
    let lastError: unknown;
    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      try {
        const directions = await this.requestDirections(request);
        return { directions };
      } catch (error) {
        lastError = error;
        // model_error / unparseable_response are worth one retry (transient upstream blip or a
        // one-off malformed generation); anything else won't improve on a retry, so stop early.
        if (error instanceof DirectionsGenerationError && error.code === "internal_error") {
          throw error;
        }
      }
    }
    if (lastError instanceof DirectionsGenerationError) throw lastError;
    throw new DirectionsGenerationError(
      "model_error",
      `Claude directions generation failed after ${MAX_ATTEMPTS} attempts: ${
        lastError instanceof Error ? lastError.message : String(lastError)
      }`
    );
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

  private async requestDirections(request: DirectionsRequest): Promise<Direction[]> {
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
          "You are a senior product designer proposing iteration directions. Given a critique, a design goal, and stakeholder feedback, you produce a small set of genuinely distinct strategic directions to explore — each a different way to resolve the real problems (signal), never the same idea reworded. You ground each direction in the specific signal items it addresses and stay concrete.",
        tools: [directionsTool],
        tool_choice: { type: "tool", name: SUBMIT_DIRECTIONS_TOOL },
        messages: [{ role: "user", content: [{ type: "text", text: buildDirectionsPrompt(request) }] }],
      }),
    });

    if (!response.ok) {
      const body = await response.text().catch(() => "");
      throw new DirectionsGenerationError(
        "model_error",
        `Anthropic API returned ${response.status} ${response.statusText}: ${body.slice(0, 500)}`
      );
    }

    const payload = (await response.json()) as AnthropicMessageResponse;
    const toolUse = payload.content.find((block) => block.type === "tool_use" && block.name === SUBMIT_DIRECTIONS_TOOL);
    if (!toolUse) {
      throw new DirectionsGenerationError(
        "unparseable_response",
        `Claude did not call ${SUBMIT_DIRECTIONS_TOOL} (stop_reason: ${payload.stop_reason}).`
      );
    }

    return toDirections(toolUse.input, request.patternReferences);
  }
}

