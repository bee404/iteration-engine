import assert from "node:assert/strict";
import { test } from "node:test";
import { FallbackLLMProvider } from "./fallback-provider";
import { CritiqueGenerationError, DirectionsGenerationError } from "./errors";
import type {
  CritiqueRequest,
  CritiqueResult,
  DirectionsRequest,
  DirectionsResult,
  LLMProvider,
} from "./types";

const CRITIQUE_REQUEST: CritiqueRequest = {
  screenshotRef: "data:image/png;base64,x",
  designGoal: "g",
  feedbackText: "f",
};

const STUB_CRITIQUE = { summary: "s", signal: [], preference: [], flaggedAmbiguities: [], model: "stub" };

const DIRECTIONS_REQUEST: DirectionsRequest = {
  critique: STUB_CRITIQUE,
  designGoal: "g",
  feedbackText: "f",
  patternReferences: [],
};

/** Stub LLMProvider whose two methods are individually configurable, so tests can assert
 * fallback triggers on one method's failure without the other interfering. */
class StubLLMProvider implements LLMProvider {
  calls = { critique: 0, directions: 0 };

  constructor(
    readonly name: string,
    private readonly critiqueImpl: () => Promise<CritiqueResult>,
    private readonly directionsImpl: () => Promise<DirectionsResult>
  ) {}

  async generateCritique(): Promise<CritiqueResult> {
    this.calls.critique++;
    return this.critiqueImpl();
  }

  async generateDirections(): Promise<DirectionsResult> {
    this.calls.directions++;
    return this.directionsImpl();
  }
}

const okCritique: CritiqueResult = { critique: STUB_CRITIQUE };
const okDirections: DirectionsResult = { directions: [] };

test("generateCritique returns the primary's result without touching the secondary when the primary succeeds", async () => {
  const primary = new StubLLMProvider(
    "claude",
    async () => okCritique,
    async () => okDirections
  );
  const secondary = new StubLLMProvider(
    "gpt-4o",
    async () => {
      throw new Error("secondary should not be called");
    },
    async () => okDirections
  );
  const fallback = new FallbackLLMProvider(primary, secondary);

  const result = await fallback.generateCritique(CRITIQUE_REQUEST);
  assert.equal(result, okCritique);
  assert.equal(secondary.calls.critique, 0);
});

test("generateCritique falls through to the secondary only after the primary throws its typed error", async () => {
  const primary = new StubLLMProvider(
    "claude",
    async () => {
      throw new CritiqueGenerationError("model_error", "Claude exhausted its retries");
    },
    async () => okDirections
  );
  const secondary = new StubLLMProvider(
    "gpt-4o",
    async () => okCritique,
    async () => okDirections
  );
  const fallback = new FallbackLLMProvider(primary, secondary);

  const result = await fallback.generateCritique(CRITIQUE_REQUEST);
  assert.equal(result, okCritique);
  assert.equal(primary.calls.critique, 1);
  assert.equal(secondary.calls.critique, 1);
});

test("generateCritique does not fall back on a non-typed error — it propagates immediately", async () => {
  const bug = new Error("unrelated bug, not a modeled failure mode");
  const primary = new StubLLMProvider(
    "claude",
    async () => {
      throw bug;
    },
    async () => okDirections
  );
  const secondary = new StubLLMProvider(
    "gpt-4o",
    async () => {
      throw new Error("secondary should not be called for a non-typed error");
    },
    async () => okDirections
  );
  const fallback = new FallbackLLMProvider(primary, secondary);

  await assert.rejects(() => fallback.generateCritique(CRITIQUE_REQUEST), bug);
  assert.equal(secondary.calls.critique, 0);
});

test("generateCritique surfaces the secondary's typed error when both backends exhaust their retries", async () => {
  const secondaryError = new CritiqueGenerationError("model_error", "GPT-4o also failed");
  const primary = new StubLLMProvider(
    "claude",
    async () => {
      throw new CritiqueGenerationError("model_error", "Claude exhausted its retries");
    },
    async () => okDirections
  );
  const secondary = new StubLLMProvider(
    "gpt-4o",
    async () => {
      throw secondaryError;
    },
    async () => okDirections
  );
  const fallback = new FallbackLLMProvider(primary, secondary);

  await assert.rejects(() => fallback.generateCritique(CRITIQUE_REQUEST), secondaryError);
});

test("generateDirections falls through to the secondary only after the primary throws its typed error", async () => {
  const primary = new StubLLMProvider(
    "claude",
    async () => okCritique,
    async () => {
      throw new DirectionsGenerationError("unparseable_response", "Claude's directions didn't validate");
    }
  );
  const secondary = new StubLLMProvider(
    "gpt-4o",
    async () => okCritique,
    async () => okDirections
  );
  const fallback = new FallbackLLMProvider(primary, secondary);

  const result = await fallback.generateDirections(DIRECTIONS_REQUEST);
  assert.equal(result, okDirections);
  assert.equal(primary.calls.directions, 1);
  assert.equal(secondary.calls.directions, 1);
});

test("generateDirections does not fall back on a non-typed error", async () => {
  const bug = new Error("unrelated bug");
  const primary = new StubLLMProvider(
    "claude",
    async () => okCritique,
    async () => {
      throw bug;
    }
  );
  const secondary = new StubLLMProvider(
    "gpt-4o",
    async () => okCritique,
    async () => {
      throw new Error("secondary should not be called");
    }
  );
  const fallback = new FallbackLLMProvider(primary, secondary);

  await assert.rejects(() => fallback.generateDirections(DIRECTIONS_REQUEST), bug);
  assert.equal(secondary.calls.directions, 0);
});
