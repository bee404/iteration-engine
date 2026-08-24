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

const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";
const DEFAULT_MODEL = "gpt-4o";

const critiqueTool = {
  type: "function",
  function: {
    name: SUBMIT_CRITIQUE_TOOL,
    description: CRITIQUE_TOOL_DESCRIPTION,
    parameters: CRITIQUE_INPUT_SCHEMA,
  },
} as const;

const directionsTool = {
  type: "function",
  function: {
    name: SUBMIT_DIRECTIONS_TOOL,
    description: DIRECTIONS_TOOL_DESCRIPTION,
    parameters: DIRECTIONS_INPUT_SCHEMA,
  },
} as const;

interface OpenAIToolCall {
  id: string;
  type: string;
  function: { name: string; arguments: string };
}

interface OpenAIChatCompletionResponse {
  choices: Array<{
    finish_reason: string;
    message: { tool_calls?: OpenAIToolCall[] };
  }>;
}

/** Parses a tool call's stringified JSON `arguments` into the object shape `parseToolInput` /
 * `toDirections` expect. Unlike Anthropic (which returns already-parsed `input`), OpenAI's
 * function-calling response carries the arguments as a raw JSON string that itself can be
 * malformed — that failure mode is validation, not a network error, so it maps to the same
 * "unparseable_response" code the rest of the pipeline already uses. */
function parseToolCallArguments(
  toolCall: OpenAIToolCall | undefined,
  toolName: string,
  errorClass: typeof CritiqueGenerationError | typeof DirectionsGenerationError
): unknown {
  if (!toolCall) {
    throw new errorClass("unparseable_response", `GPT-4o did not call ${toolName}.`);
  }
  try {
    return JSON.parse(toolCall.function.arguments);
  } catch (error) {
    throw new errorClass(
      "unparseable_response",
      `GPT-4o's ${toolName} arguments were not valid JSON: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * GPT-4o fallback provider, used only when ClaudeLLMProvider exhausts its own retries and
 * throws its typed generation error (see lib/providers/llm/index.ts and
 * lib/providers/llm/fallback-provider.ts) — never as a parallel primary. Mirrors
 * ClaudeLLMProvider's shape exactly: same retry count, same forced-structured-output
 * strategy (OpenAI function calling in place of Anthropic's tool_choice), same typed errors
 * on exhausted failure, so a caller that only sees `LLMProvider` can't tell which backend ran.
 * Tool schemas, prompts, and response validation are shared with ClaudeLLMProvider via
 * ./shared.ts.
 */
export class OpenAILLMProvider implements LLMProvider {
  readonly name = "gpt-4o";

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
        if (error instanceof CritiqueGenerationError && error.code === "invalid_screenshot") {
          throw error;
        }
      }
    }
    if (lastError instanceof CritiqueGenerationError) throw lastError;
    throw new CritiqueGenerationError(
      "model_error",
      `GPT-4o critique generation failed after ${MAX_ATTEMPTS} attempts: ${
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
        if (error instanceof DirectionsGenerationError && error.code === "internal_error") {
          throw error;
        }
      }
    }
    if (lastError instanceof DirectionsGenerationError) throw lastError;
    throw new DirectionsGenerationError(
      "model_error",
      `GPT-4o directions generation failed after ${MAX_ATTEMPTS} attempts: ${
        lastError instanceof Error ? lastError.message : String(lastError)
      }`
    );
  }

  private async requestCritique(request: CritiqueRequest): Promise<Critique> {
    const image = await resolveScreenshot(request.screenshotRef);
    const dataUrl = `data:${image.mediaType};base64,${image.base64Data}`;

    const response = await fetch(OPENAI_API_URL, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        max_tokens: 2048,
        tools: [critiqueTool],
        tool_choice: { type: "function", function: { name: SUBMIT_CRITIQUE_TOOL } },
        messages: [
          { role: "system", content: CRITIQUE_SYSTEM_PROMPT },
          {
            role: "user",
            content: [
              { type: "text", text: buildPrompt(request) },
              { type: "image_url", image_url: { url: dataUrl } },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      const body = await response.text().catch(() => "");
      throw new CritiqueGenerationError(
        "model_error",
        `OpenAI API returned ${response.status} ${response.statusText}: ${body.slice(0, 500)}`
      );
    }

    const payload = (await response.json()) as OpenAIChatCompletionResponse;
    const toolCall = payload.choices[0]?.message.tool_calls?.find((call) => call.function.name === SUBMIT_CRITIQUE_TOOL);
    const input = parseToolCallArguments(toolCall, SUBMIT_CRITIQUE_TOOL, CritiqueGenerationError);

    return parseToolInput(input, this.name);
  }

  private async requestDirections(request: DirectionsRequest): Promise<Direction[]> {
    const response = await fetch(OPENAI_API_URL, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        max_tokens: 2048,
        tools: [directionsTool],
        tool_choice: { type: "function", function: { name: SUBMIT_DIRECTIONS_TOOL } },
        messages: [
          { role: "system", content: DIRECTIONS_SYSTEM_PROMPT },
          { role: "user", content: buildDirectionsPrompt(request) },
        ],
      }),
    });

    if (!response.ok) {
      const body = await response.text().catch(() => "");
      throw new DirectionsGenerationError(
        "model_error",
        `OpenAI API returned ${response.status} ${response.statusText}: ${body.slice(0, 500)}`
      );
    }

    const payload = (await response.json()) as OpenAIChatCompletionResponse;
    const toolCall = payload.choices[0]?.message.tool_calls?.find((call) => call.function.name === SUBMIT_DIRECTIONS_TOOL);
    const input = parseToolCallArguments(toolCall, SUBMIT_DIRECTIONS_TOOL, DirectionsGenerationError);

    return toDirections(input, request.patternReferences);
  }
}
