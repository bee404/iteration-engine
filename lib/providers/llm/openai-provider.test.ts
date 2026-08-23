import assert from "node:assert/strict";
import { test } from "node:test";
import { OpenAILLMProvider } from "./openai-provider";
import { CritiqueGenerationError, DirectionsGenerationError } from "./errors";
import type { CritiqueRequest, DirectionsRequest } from "./types";

const SCREENSHOT_REF =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==";

const CRITIQUE_REQUEST: CritiqueRequest = {
  screenshotRef: SCREENSHOT_REF,
  designGoal: "Make the primary CTA unmistakable.",
  feedbackText: "The save button blends into the background.",
};

/** Builds a non-streaming OpenAI chat-completions response whose message contains a single
 * tool call for `toolName`, JSON-stringifying `args` the way the real API does. */
function toolCallResponse(toolName: string, args: unknown): Response {
  return new Response(
    JSON.stringify({
      choices: [
        {
          finish_reason: "tool_calls",
          message: {
            tool_calls: [{ id: "call_1", type: "function", function: { name: toolName, arguments: JSON.stringify(args) } }],
          },
        },
      ],
    }),
    { status: 200 }
  );
}

test("generateCritique parses a well-formed OpenAI tool call into a typed Critique", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = (async () =>
    toolCallResponse("submit_critique", {
      summary: "The CTA lacks visual weight relative to surrounding chrome.",
      signal: [{ text: "Save button has no fill and low contrast against the panel background." }],
      preference: [{ text: "Reviewer would prefer a warmer accent color." }],
      flaggedAmbiguities: [],
    })) as typeof fetch;
  try {
    const provider = new OpenAILLMProvider("test-key");
    const { critique } = await provider.generateCritique(CRITIQUE_REQUEST);
    assert.equal(critique.model, "gpt-4o");
    assert.equal(critique.signal.length, 1);
    const [firstSignal] = critique.signal;
    const [firstPreference] = critique.preference;
    assert.ok(firstSignal);
    assert.ok(firstPreference);
    assert.equal(firstSignal.kind, "signal");
    assert.equal(firstPreference.kind, "preference");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("generateCritique retries once on a malformed tool call, then raises a typed error", async () => {
  const originalFetch = globalThis.fetch;
  let calls = 0;
  globalThis.fetch = (async () => {
    calls++;
    // Missing required "summary" field on every attempt.
    return toolCallResponse("submit_critique", { signal: [], preference: [], flaggedAmbiguities: [] });
  }) as typeof fetch;
  try {
    const provider = new OpenAILLMProvider("test-key");
    await assert.rejects(
      () => provider.generateCritique(CRITIQUE_REQUEST),
      (err: unknown) => err instanceof CritiqueGenerationError && err.code === "unparseable_response"
    );
    assert.equal(calls, 2);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("generateCritique raises model_error after both attempts fail on a non-ok response", async () => {
  const originalFetch = globalThis.fetch;
  let calls = 0;
  globalThis.fetch = (async () => {
    calls++;
    return new Response("insufficient_quota", { status: 429, statusText: "Too Many Requests" });
  }) as typeof fetch;
  try {
    const provider = new OpenAILLMProvider("test-key");
    await assert.rejects(
      () => provider.generateCritique(CRITIQUE_REQUEST),
      (err: unknown) => err instanceof CritiqueGenerationError && err.code === "model_error"
    );
    assert.equal(calls, 2);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

const DIRECTIONS_REQUEST: DirectionsRequest = {
  critique: {
    summary: "s",
    signal: [{ kind: "signal", text: "Save button is easy to miss." }],
    preference: [],
    flaggedAmbiguities: [],
    model: "gpt-4o",
  },
  designGoal: "Make the primary CTA unmistakable.",
  feedbackText: "The save button blends into the background.",
  patternReferences: [],
};

function threeDirections() {
  return {
    directions: [
      { title: "A", rationale: "ra", tradeoffs: "ta", suggestedChanges: ["ca"] },
      { title: "B", rationale: "rb", tradeoffs: "tb", suggestedChanges: ["cb"] },
      { title: "C", rationale: "rc", tradeoffs: "tc", suggestedChanges: ["cc"] },
    ],
  };
}

test("generateDirections parses a well-formed OpenAI tool call into typed Directions", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = (async () => toolCallResponse("submit_directions", threeDirections())) as typeof fetch;
  try {
    const provider = new OpenAILLMProvider("test-key");
    const { directions } = await provider.generateDirections(DIRECTIONS_REQUEST);
    assert.equal(directions.length, 3);
    const [firstDirection] = directions;
    assert.ok(firstDirection);
    assert.equal(firstDirection.title, "A");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("generateDirections raises unparseable_response when directions aren't substantively distinct", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = (async () =>
    toolCallResponse("submit_directions", {
      directions: [
        { title: "A", rationale: "same", tradeoffs: "ta", suggestedChanges: ["c"] },
        { title: "B", rationale: "same", tradeoffs: "tb", suggestedChanges: ["c"] },
        { title: "C", rationale: "different", tradeoffs: "tc", suggestedChanges: ["cc"] },
      ],
    })) as typeof fetch;
  try {
    const provider = new OpenAILLMProvider("test-key");
    await assert.rejects(
      () => provider.generateDirections(DIRECTIONS_REQUEST),
      (err: unknown) => err instanceof DirectionsGenerationError && err.code === "unparseable_response"
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
});
