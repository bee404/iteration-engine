import assert from "node:assert/strict";
import { test } from "node:test";

import {
  comparisonViewportStyle,
  fitViewportBox,
  formatComparisonViewport,
  iterationScaleStyle,
  resolveComparisonViewport,
} from "./comparison-viewport";

test("prefers the chain's locked viewport over the raw screenshot size", () => {
  const box = resolveComparisonViewport({
    lockedViewport: { width: 1440, height: 900 },
    screenshotDimensions: { width: 2880, height: 1800 },
  });
  assert.deepEqual(box, { width: 1440, height: 900 });
});

test("falls back to the screenshot size until a chain lock exists", () => {
  const box = resolveComparisonViewport({
    lockedViewport: null,
    screenshotDimensions: { width: 375, height: 812 },
  });
  assert.deepEqual(box, { width: 375, height: 812 });
});

test("rejects degenerate boxes rather than emitting an unrenderable ratio", () => {
  assert.equal(
    resolveComparisonViewport({
      lockedViewport: { width: 0, height: 900 },
      screenshotDimensions: null,
    }),
    null,
  );
  assert.equal(
    resolveComparisonViewport({
      lockedViewport: null,
      screenshotDimensions: { width: 375, height: Number.NaN },
    }),
    null,
  );
});

// An unusable lock must not shadow a usable screenshot size — the box degrades, it doesn't vanish.
test("an unusable lock falls through to the screenshot size", () => {
  assert.deepEqual(
    resolveComparisonViewport({
      lockedViewport: { width: -1, height: 900 },
      screenshotDimensions: { width: 375, height: 812 },
    }),
    { width: 375, height: 812 },
  );
});

test("fitting scales down to the tighter axis and holds the ratio exactly", () => {
  // Height-bound: a 1440x900 desktop box in a wide but short stage.
  assert.deepEqual(fitViewportBox({ width: 1440, height: 900 }, { width: 1200, height: 450 }), {
    width: 720,
    height: 450,
  });
  // Width-bound: the same box in a narrow but tall stage.
  assert.deepEqual(fitViewportBox({ width: 1440, height: 900 }, { width: 720, height: 900 }), {
    width: 720,
    height: 450,
  });
});

test("fitting never upscales a box past its natural size", () => {
  assert.deepEqual(fitViewportBox({ width: 375, height: 812 }, { width: 1200, height: 2000 }), {
    width: 375,
    height: 812,
  });
});

test("a full-page capture still fits rather than overflowing the stage", () => {
  const fitted = fitViewportBox({ width: 1440, height: 9196 }, { width: 1200, height: 600 });
  assert.ok(fitted.width <= 1200 && fitted.height <= 600);
  assert.equal(fitted.height, 600);
});

test("a desktop viewport fits inside the bounded Step 5 canvas", () => {
  assert.deepEqual(fitViewportBox({ width: 1440, height: 900 }, { width: 1180, height: 720 }), {
    width: 1152,
    height: 720,
  });
  assert.equal(
    iterationScaleStyle({ width: 1440, height: 900 }, { width: 1180, height: 720 }).transform,
    "scale(0.8)",
  );
});

test("box style emits the fitted pixel size", () => {
  assert.deepEqual(comparisonViewportStyle({ width: 1440, height: 900 }, { width: 1200, height: 450 }), {
    width: "720px",
    height: "450px",
  });
});

test("an unknown round size fills the stage, while a known box waits for stage measurement", () => {
  const filled = { width: "100%", height: "100%" };
  assert.deepEqual(comparisonViewportStyle({ width: 1440, height: 900 }, null), {
    width: "0px",
    height: "0px",
    visibility: "hidden",
  });
  assert.deepEqual(comparisonViewportStyle(null, { width: 1200, height: 450 }), filled);
});

test("the iteration layer lays out at true viewport pixels, then scales into the box", () => {
  // Not 720px wide: the component must resolve the 1440px breakpoint the reference was shot at.
  assert.deepEqual(iterationScaleStyle({ width: 1440, height: 900 }, { width: 1200, height: 450 }), {
    width: "1440px",
    height: "900px",
    transform: "scale(0.5)",
    transformOrigin: "top left",
  });
});

test("the iteration layer is never scaled up past 1:1", () => {
  const style = iterationScaleStyle({ width: 375, height: 812 }, { width: 1200, height: 2000 });
  assert.equal(style.transform, "scale(1)");
});

test("an unmeasured stage hides the iteration layer until it can be scaled", () => {
  const filled = { width: "100%", height: "100%" };
  assert.deepEqual(iterationScaleStyle({ width: 1440, height: 900 }, null), {
    width: "0px",
    height: "0px",
    visibility: "hidden",
  });
  assert.deepEqual(iterationScaleStyle(null, { width: 1200, height: 450 }), filled);
});

test("caption reports the box, and says so when there isn't one", () => {
  assert.equal(formatComparisonViewport({ width: 1440, height: 900 }), "1440 \u00d7 900");
  assert.equal(formatComparisonViewport(null), "size unknown");
});
