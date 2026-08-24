import assert from "node:assert/strict";
import { test } from "node:test";

import {
  MAX_VIEWPORT_EDGE,
  formatViewportBox,
  parseViewportBox,
  toViewportBoxDraft,
} from "./viewport-box";

test("accepts a whole-pixel correction", () => {
  assert.deepEqual(parseViewportBox({ width: " 1440 ", height: "900" }), {
    status: "valid",
    box: { width: 1440, height: 900 },
  });
});

test("rejects edges that are not whole positive pixels", () => {
  for (const draft of [
    { width: "", height: "900" },
    { width: "1440", height: "" },
    { width: "0", height: "900" },
    { width: "-1440", height: "900" },
    { width: "1440.5", height: "900" },
    { width: "1e3", height: "900" },
    { width: "wide", height: "900" },
    { width: String(MAX_VIEWPORT_EDGE + 1), height: "900" },
  ]) {
    assert.equal(parseViewportBox(draft).status, "invalid", JSON.stringify(draft));
  }
});

test("round-trips a box through the draft the inputs hold", () => {
  const box = { width: 1280, height: 832 };
  assert.deepEqual(parseViewportBox(toViewportBoxDraft(box)), { status: "valid", box });
});

test("an absent box opens the inputs empty rather than at zero", () => {
  assert.deepEqual(toViewportBoxDraft(null), { width: "", height: "" });
});

test("formats a box with the multiplication sign the captions use", () => {
  assert.equal(formatViewportBox({ width: 1440, height: 900 }), "1440 \u00d7 900");
});

