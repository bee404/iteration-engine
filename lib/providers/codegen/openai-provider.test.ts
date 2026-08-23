import assert from "node:assert/strict";
import { test } from "node:test";
import { OpenAICodeGenProvider } from "./openai-provider";
import { CodeGenGenerationError } from "./errors";
import type { Direction } from "@/lib/types";

const DIRECTION: Direction = {
  id: "d1",
  title: "Make the next action unmistakable",
  rationale: "r",
  tradeoffs: "t",
  suggestedChanges: ["c"],
  patternReference: null,
};

const SCREENSHOT_REF =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==";

/** Builds a Response streaming OpenAI-shaped chat-completion SSE chunks: one delta carrying
 * `text` as a single content chunk, a terminal chunk carrying `finishReason`, then [DONE]. */
function openaiStreamResponse(text: string, finishReason: string): Response {
  const encoder = new TextEncoder();
  const frame = (payload: unknown) => `data: ${JSON.stringify(payload)}\n\n`;
  const body = new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(encoder.encode(frame({ choices: [{ delta: { content: text }, finish_reason: null }] })));
      controller.enqueue(encoder.encode(frame({ choices: [{ delta: {}, finish_reason: finishReason }] })));
      controller.enqueue(encoder.encode("data: [DONE]\n\n"));
      controller.close();
    },
  });
  return new Response(body, { status: 200 });
}

async function collect(provider: OpenAICodeGenProvider): Promise<string> {
  let raw = "";
  for await (const token of provider.streamCode({ direction: DIRECTION, designGoal: "g", screenshotRef: SCREENSHOT_REF })) {
    raw += token;
  }
  return raw;
}

test("streamCode yields OpenAI's streamed content and completes normally on finish_reason=stop", async () => {
  const originalFetch = globalThis.fetch;
  const complete = "const App = () => <div>hi</div>;\nexport default App;\n";
  globalThis.fetch = (async () => openaiStreamResponse(complete, "stop")) as typeof fetch;
  try {
    const provider = new OpenAICodeGenProvider("test-key");
    assert.equal(await collect(provider), complete);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("streamCode raises a truncated_response error when GPT-4o stops at the token ceiling", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = (async () => openaiStreamResponse("const App = () => <div", "length")) as typeof fetch;
  try {
    const provider = new OpenAICodeGenProvider("test-key");
    await assert.rejects(
      () => collect(provider),
      (err: unknown) => err instanceof CodeGenGenerationError && err.code === "truncated_response"
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("streamCode raises model_error when the OpenAI API returns a non-ok response", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = (async () => new Response("insufficient_quota", { status: 429, statusText: "Too Many Requests" })) as typeof fetch;
  try {
    const provider = new OpenAICodeGenProvider("test-key");
    await assert.rejects(
      () => collect(provider),
      (err: unknown) => err instanceof CodeGenGenerationError && err.code === "model_error"
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("streamCode requests the 16384-token ceiling, matching ClaudeCodeGenProvider", async () => {
  const originalFetch = globalThis.fetch;
  let sentMaxTokens: unknown;
  globalThis.fetch = (async (_url: string, init?: RequestInit) => {
    sentMaxTokens = JSON.parse(String(init?.body)).max_tokens;
    return openaiStreamResponse("const App = () => <div/>;\nexport default App;\n", "stop");
  }) as typeof fetch;
  try {
    await collect(new OpenAICodeGenProvider("test-key"));
    assert.equal(sentMaxTokens, 16384);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
