import assert from "node:assert/strict";
import { test } from "node:test";

import type { CodeGenRequest } from "./types";
import { buildPrompt, resolveDesignSystemForRequest } from "./shared";
import { CodeGenGenerationError } from "./errors";

const BASE_REQUEST: CodeGenRequest = {
  direction: {
    id: "direction-1",
    title: "Make the next action unmistakable",
    rationale: "The active task needs stronger hierarchy.",
    tradeoffs: "The primary task carries more visual weight.",
    suggestedChanges: ["Emphasize only the active task", "Keep completed and future tasks intact"],
    patternReference: null,
  },
  designGoal: "Make onboarding easier to complete.",
  feedbackText: "The page should feel warmer, but keep the existing visual language.",
  reviewerContext: "First-time admin",
  constraints: "Do not replace the sidebar or switch themes.",
  critique: {
    summary: "The active task lacks hierarchy.",
    signal: [{ kind: "signal", text: "The primary task is hard to distinguish." }],
    preference: [{ kind: "preference", text: "The reviewer prefers a warmer feel." }],
    flaggedAmbiguities: ["Warmer is visually ambiguous."],
    model: "test-model",
  },
  viewport: { width: 1478, height: 1064 },
  generationMode: "preserve-source",
  screenshotRef: "data:image/png;base64,x",
};

test("preserve-source prompt carries the complete round and protects the source visual system", () => {
  const prompt = buildPrompt(BASE_REQUEST);

  assert.match(prompt, /PRESERVE SOURCE/);
  assert.match(prompt, /dominant light\/dark theme/);
  assert.match(prompt, /Never replace the source with a generic template or invert its theme/);
  assert.match(prompt, /The page should feel warmer/);
  assert.match(prompt, /First-time admin/);
  assert.match(prompt, /Do not replace the sidebar/);
  assert.match(prompt, /The active task lacks hierarchy/);
  assert.match(prompt, /"width": 1478/);
  assert.match(prompt, /"height": 1064/);
  assert.match(prompt, /Make the next action unmistakable/);
  assert.doesNotMatch(prompt, /Vercel Geist/);
  assert.equal(resolveDesignSystemForRequest(BASE_REQUEST), null);
});

test("an explicit design-system mode includes the selected system", () => {
  const request: CodeGenRequest = {
    ...BASE_REQUEST,
    generationMode: "apply-design-system",
    designSystemId: "vercel-geist",
  };

  const prompt = buildPrompt(request);
  assert.match(prompt, /APPLY AN EXPLICIT DESIGN SYSTEM/);
  assert.match(prompt, /Vercel Geist/);
  assert.equal(resolveDesignSystemForRequest(request)?.id, "vercel-geist");
});

test("apply-design-system mode rejects a missing design system", () => {
  const request: CodeGenRequest = { ...BASE_REQUEST, generationMode: "apply-design-system" };

  assert.throws(
    () => buildPrompt(request),
    (error: unknown) =>
      error instanceof CodeGenGenerationError && /recognized designSystemId/.test(error.message),
  );
});
