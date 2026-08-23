import assert from "node:assert/strict";
import { test } from "node:test";
import { getLLMProvider } from "./index";
import { ClaudeLLMProvider } from "./claude-provider";
import { FallbackLLMProvider } from "./fallback-provider";

/** Snapshots and restores every env var this factory reads, so tests can freely mutate
 * process.env without leaking state into other test files run in the same process. */
function withEnv(vars: Record<string, string | undefined>, run: () => void) {
  const keys = ["DEMO_MODE", "LLM_PROVIDER", "ANTHROPIC_API_KEY", "OPENAI_API_KEY"] as const;
  const original = Object.fromEntries(keys.map((key) => [key, process.env[key]]));
  try {
    for (const key of keys) {
      if (vars[key] === undefined) delete process.env[key];
      else process.env[key] = vars[key];
    }
    run();
  } finally {
    for (const key of keys) {
      if (original[key] === undefined) delete process.env[key];
      else process.env[key] = original[key];
    }
  }
}

test("getLLMProvider returns a bare ClaudeLLMProvider when OPENAI_API_KEY is unset — no wrapper, no behavior change", () => {
  withEnv({ ANTHROPIC_API_KEY: "test-anthropic-key", OPENAI_API_KEY: undefined }, () => {
    const provider = getLLMProvider();
    assert.ok(provider instanceof ClaudeLLMProvider);
    assert.ok(!(provider instanceof FallbackLLMProvider));
    assert.equal(provider.name, "claude-sonnet");
  });
});

test("getLLMProvider wraps Claude in FallbackLLMProvider once OPENAI_API_KEY is set", () => {
  withEnv({ ANTHROPIC_API_KEY: "test-anthropic-key", OPENAI_API_KEY: "test-openai-key" }, () => {
    const provider = getLLMProvider();
    assert.ok(provider instanceof FallbackLLMProvider);
  });
});

test("getLLMProvider ignores OPENAI_API_KEY entirely when ANTHROPIC_API_KEY is unset (falls to mock, as before)", () => {
  withEnv({ ANTHROPIC_API_KEY: undefined, OPENAI_API_KEY: "test-openai-key" }, () => {
    const provider = getLLMProvider();
    assert.ok(!(provider instanceof FallbackLLMProvider));
    assert.ok(!(provider instanceof ClaudeLLMProvider));
  });
});
