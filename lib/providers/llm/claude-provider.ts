import { CritiqueGenerationError, DirectionsGenerationError } from "./errors";
import type { CritiqueRequest, CritiqueResult, DirectionsRequest, DirectionsResult, LLMProvider } from "./types";
import type { Critique, Direction } from "@/lib/types";
import {
  buildDirectionsPrompt,
  buildPrompt,
  CRITIQUE_INPUT_SCHEMA,
  CRITIQUE_SYSTEM_PROMPT,
  CRITIQUE_TOOL_DESCRIPTION,
  DIRECTIONS_INPUT_SCHEMA,
  DIRECTIONS_SYSTEM_PROMPT,
  DIRECTIONS_TOOL_DESCRIPTION,
  MAX_ATTEMPTS,
  parseToolInput,
  resolveScreenshot,
  SUBMIT_CRITIQUE_TOOL,
  SUBMIT_DIRECTIONS_TOOL,
  toDirections,
} from "./shared";

const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";
const ANTHROPIC_VERSION = "2023-06-01";
const DEFAULT_MODEL = "claude-sonnet-4-5-20250929";

const critiqueTool = {
  name: SUBMIT_CRITIQUE_TOOL,
  description: CRITIQUE_TOOL_DESCRIPTION,
  input_schema: CRITIQUE_INPUT_SCHEMA,
} as const;

const directionsTool = {
  name: SUBMIT_DIRECTIONS_TOOL,
  description: DIRECTIONS_TOOL_DESCRIPTION,
  input_schema: DIRECTIONS_INPUT_SCHEMA,
} as const;

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
 *
 * Tool schemas, prompts, and response validation are shared with OpenAILLMProvider via
 * ./shared.ts — only the Anthropic wire format (tool_choice shape, content blocks) lives here.
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
        system: CRITIQUE_SYSTEM_PROMPT,
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
        system: DIRECTIONS_SYSTEM_PROMPT,
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
