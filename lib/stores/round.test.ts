import assert from "node:assert/strict";
import { afterEach, test } from "node:test";

import type { Critique, Direction } from "@/lib/types";
import { useRoundStore } from "./round";

const critique: Critique = {
  summary: "The next action is unclear.",
  signal: [{ kind: "signal", text: "Two actions compete." }],
  preference: [],
  flaggedAmbiguities: [],
  model: "test",
};

const directions: Direction[] = [
  {
    id: "a",
    title: "Clarify hierarchy",
    rationale: "Make one action primary.",
    tradeoffs: "Other actions become quieter.",
    suggestedChanges: ["Increase contrast"],
    patternReference: null,
  },
  {
    id: "b",
    title: "Reduce density",
    rationale: "Create more separation.",
    tradeoffs: "The page becomes longer.",
    suggestedChanges: ["Add spacing"],
    patternReference: null,
  },
];

afterEach(() => useRoundStore.getState().reset());

test("one canonical round carries selection into its generated prototype", () => {
  const state = useRoundStore.getState();
  state.beginTransition(
    { dataUrl: "data:image/png;base64,AA==", fileName: "screen.png", dimensions: { width: 800, height: 600 } },
    { top: 0, left: 0, width: 400, height: 300 },
  );
  state.setBrief({ goal: "Clarify", feedback: "It is unclear", reviewerContext: "", constraints: "" });
  state.setCritique(critique);
  state.setDirections(critique, directions);
  state.selectDirection("a");
  state.startPrototype("a", "tsx");
  state.appendPrototypeToken("a", "function Preview() {} ");
  state.finalizePrototype("a", "function Preview() {}", [], {
    provider: "anthropic",
    model: "claude-sonnet-4-5-20250929",
  });
  state.completePrototype("a");

  assert.equal(useRoundStore.getState().selectedDirectionId, "a");
  assert.deepEqual(useRoundStore.getState().prototype, {
    directionId: "a",
    status: "complete",
    code: "function Preview() {}",
    language: "tsx",
    provenance: { provider: "anthropic", model: "claude-sonnet-4-5-20250929" },
    warnings: [],
  });
});

test("changing the selected direction invalidates generated output", () => {
  const state = useRoundStore.getState();
  state.selectDirection("a");
  state.startPrototype("a", "tsx");
  assert.equal(useRoundStore.getState().prototype?.provenance, null);
  state.completePrototype("a");
  state.selectDirection("b");

  assert.equal(useRoundStore.getState().selectedDirectionId, "b");
  assert.equal(useRoundStore.getState().prototype, null);
});
