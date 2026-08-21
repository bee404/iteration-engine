import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import { ClaudeCodeGenProvider } from "./claude-provider";
import { CodeGenGenerationError } from "./errors";
import type { Direction } from "@/lib/types";

// The exact raw TSX Claude streamed on a real run that fell back to read-only source: it stops
// mid-file at `fontSize: '` because generation hit the output-token ceiling (stop_reason
// "max_tokens"). Captured verbatim so the regression is grounded in a real failing sample, not
// a hand-written approximation. See scripts/repro-live-preview.ts for how it was reproduced.
// Path is resolved from the repo root (process.cwd()) rather than import.meta.dirname, which is
// undefined under tsx's CJS transform; the test runner always runs from the repo root.
const TRUNCATED_SAMPLE = readFileSync(
  join(process.cwd(), "lib", "providers", "codegen", "__fixtures__", "truncated-max-tokens.raw.txt"),
  "utf-8",
);

const DIRECTION: Direction = {
  id: "d1",
  title: "Make the next action unmistakable",
  rationale: "r",
  tradeoffs: "t",
  suggestedChanges: ["c"],
  patternReference: null,
};

// A 1x1 png data URL: resolveScreenshot accepts it without a network fetch, so these tests
// exercise the streaming path in isolation.
const SCREENSHOT_REF =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==";

/** Builds a Response whose body streams Anthropic-shaped SSE frames: one text delta carrying
 * `text`, then a terminal message_delta carrying `stopReason`. Mirrors the framing
 * consumeStream parses (data: lines separated by blank lines). */
function anthropicStreamResponse(text: string, stopReason: string): Response {
  const encoder = new TextEncoder();
  const frame = (payload: unknown) => `data: ${JSON.stringify(payload)}\n\n`;
  const body = new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(
        encoder.encode(
          frame({ type: "content_block_delta", index: 0, delta: { type: "text_delta", text } }),
        ),
      );
      controller.enqueue(
        encoder.encode(
          frame({ type: "message_delta", delta: { stop_reason: stopReason, stop_sequence: null } }),
        ),
      );
      controller.close();
    },
  });
  return new Response(body, { status: 200 });
}

async function collect(provider: ClaudeCodeGenProvider): Promise<string> {
  let raw = "";
  for await (const token of provider.streamCode({
    direction: DIRECTION,
    designGoal: "g",
    screenshotRef: SCREENSHOT_REF,
  })) {
    raw += token;
  }
  return raw;
}

test("streamCode raises a truncated_response error when Claude stops at the token ceiling", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = (async () => anthropicStreamResponse(TRUNCATED_SAMPLE, "max_tokens")) as typeof fetch;
  try {
    const provider = new ClaudeCodeGenProvider("test-key");
    const collected: string[] = [];
    await assert.rejects(
      async () => {
        for await (const token of provider.streamCode({
          direction: DIRECTION,
          designGoal: "g",
          screenshotRef: SCREENSHOT_REF,
        })) {
          collected.push(token);
        }
      },
      (err: unknown) =>
        err instanceof CodeGenGenerationError && err.code === "truncated_response",
    );
    // The partial tokens are still streamed (for the live preview) before the error is raised;
    // only the terminal failure differs from a clean run.
    assert.equal(collected.join(""), TRUNCATED_SAMPLE);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("streamCode completes normally when the stream stops with end_turn", async () => {
  const originalFetch = globalThis.fetch;
  const complete = "const App = () => <div>hi</div>;\nexport default App;\n";
  globalThis.fetch = (async () => anthropicStreamResponse(complete, "end_turn")) as typeof fetch;
  try {
    const provider = new ClaudeCodeGenProvider("test-key");
    assert.equal(await collect(provider), complete);
  } finally {
    globalThis.fetch = originalFetch;
  }
});



// Regression for the PR #16 QA silent stall on dense, full-page directions (checkout, dense
// tables, settings, CRM detail): reproduced directly, these reliably produced ~30k characters
// and truncated at the 8192 ceiling. The ceiling was raised to 16384 so they now complete and
// mount. This pins the request's max_tokens so a future edit that lowers it — reopening the
// truncation — fails here rather than silently in production.
test("streamCode requests the raised 16384-token ceiling so dense pages don't truncate", async () => {
  const originalFetch = globalThis.fetch;
  let sentMaxTokens: unknown;
  globalThis.fetch = (async (_url: string, init?: RequestInit) => {
    sentMaxTokens = JSON.parse(String(init?.body)).max_tokens;
    return anthropicStreamResponse("const App = () => <div/>;\nexport default App;\n", "end_turn");
  }) as typeof fetch;
  try {
    await collect(new ClaudeCodeGenProvider("test-key"));
    assert.equal(sentMaxTokens, 16384);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
