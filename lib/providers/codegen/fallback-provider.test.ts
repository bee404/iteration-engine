import assert from "node:assert/strict";
import { test } from "node:test";
import { FallbackCodeGenProvider } from "./fallback-provider";
import { CodeGenGenerationError } from "./errors";
import type { CodeGenProvider, CodeGenRequest } from "./types";
import type { Direction } from "@/lib/types";

const DIRECTION: Direction = {
  id: "d1",
  title: "t",
  rationale: "r",
  tradeoffs: "t",
  suggestedChanges: ["c"],
  patternReference: null,
};

const REQUEST: CodeGenRequest = {
  direction: DIRECTION,
  designGoal: "g",
  screenshotRef: "data:image/png;base64,x",
};

/** Stub CodeGenProvider that yields a fixed token sequence, then either completes or throws
 * the given error after yielding. */
function stubProvider(name: string, tokens: string[], failWith?: Error): CodeGenProvider {
  return {
    name,
    provenance: { provider: name, model: `${name}-model` },
    language: "tsx",
    async *streamCode(): AsyncGenerator<string, void, unknown> {
      for (const token of tokens) yield token;
      if (failWith) throw failWith;
    },
  };
}

async function collect(provider: CodeGenProvider): Promise<{ tokens: string[]; error?: unknown }> {
  const tokens: string[] = [];
  try {
    for await (const token of provider.streamCode(REQUEST)) tokens.push(token);
  } catch (error) {
    return { tokens, error };
  }
  return { tokens };
}

test("streamCode returns the primary's tokens untouched when it completes cleanly", async () => {
  const primary = stubProvider("claude", ["a", "b", "c"]);
  const secondary = stubProvider("gpt-4o", ["should not be used"]);
  const fallback = new FallbackCodeGenProvider(primary, secondary);

  const { tokens, error } = await collect(fallback);
  assert.equal(tokens.join(""), "abc");
  assert.equal(error, undefined);
  assert.deepEqual(fallback.provenance, { provider: "claude", model: "claude-model" });
});

test("streamCode falls back to the secondary when the primary fails before yielding any tokens", async () => {
  const primary = stubProvider("claude", [], new CodeGenGenerationError("model_error", "Claude API unreachable"));
  const secondary = stubProvider("gpt-4o", ["fallback", " output"]);
  const fallback = new FallbackCodeGenProvider(primary, secondary);

  const { tokens, error } = await collect(fallback);
  assert.equal(tokens.join(""), "fallback output");
  assert.equal(error, undefined);
  assert.deepEqual(fallback.provenance, { provider: "gpt-4o", model: "gpt-4o-model" });
});

test("streamCode does NOT fall back once the primary has already streamed tokens, even on a typed error", async () => {
  // truncated_response is only ever raised after tokens were streamed (see
  // ClaudeCodeGenProvider.consumeStream) — falling back here would append a second, unrelated
  // generation after a truncated one, which is worse than surfacing the typed error alone.
  const truncated = new CodeGenGenerationError("truncated_response", "hit the output-token limit");
  const primary = stubProvider("claude", ["partial "], truncated);
  const secondary = stubProvider("gpt-4o", ["should not be used"]);
  const fallback = new FallbackCodeGenProvider(primary, secondary);

  const { tokens, error } = await collect(fallback);
  assert.equal(tokens.join(""), "partial ");
  assert.equal(error, truncated);
});

test("streamCode does not fall back on a non-typed error", async () => {
  const bug = new Error("unrelated bug, not a modeled failure mode");
  const primary = stubProvider("claude", [], bug);
  const secondary = stubProvider("gpt-4o", ["should not be used"]);
  const fallback = new FallbackCodeGenProvider(primary, secondary);

  const { tokens, error } = await collect(fallback);
  assert.equal(tokens.length, 0);
  assert.equal(error, bug);
});

test("streamCode surfaces the secondary's error when both backends fail before yielding", async () => {
  const secondaryError = new CodeGenGenerationError("model_error", "GPT-4o also unreachable");
  const primary = stubProvider("claude", [], new CodeGenGenerationError("model_error", "Claude unreachable"));
  const secondary = stubProvider("gpt-4o", [], secondaryError);
  const fallback = new FallbackCodeGenProvider(primary, secondary);

  const { error } = await collect(fallback);
  assert.equal(error, secondaryError);
});
