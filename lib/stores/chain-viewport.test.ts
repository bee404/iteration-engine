import assert from "node:assert/strict";
import { beforeEach, test } from "node:test";

import { resolveComparisonViewport } from "../comparison-viewport";
import { lockedBoxOf, useChainViewport } from "./chain-viewport";

const BOX = { width: 1512, height: 982 };
const OTHER_BOX = { width: 1280, height: 800 };

beforeEach(() => {
  useChainViewport.getState().startNewChain();
});

test("a fresh chain has no box to lock onto", () => {
  assert.equal(useChainViewport.getState().viewport.status, "unmeasured");
  assert.equal(lockedBoxOf(useChainViewport.getState().viewport), null);
});

test("hydrating a persisted box restores the lock on a chain that reloaded empty", () => {
  useChainViewport.getState().hydrateLockedBox(BOX);

  assert.deepEqual(useChainViewport.getState().viewport, { status: "locked", box: BOX });
  assert.deepEqual(lockedBoxOf(useChainViewport.getState().viewport), BOX);
});

test("a committed box outranks a measurement taken before it was read back", () => {
  const { inferBox, hydrateLockedBox } = useChainViewport.getState();
  inferBox(OTHER_BOX);
  hydrateLockedBox(BOX);

  assert.deepEqual(useChainViewport.getState().viewport, { status: "locked", box: BOX });
});

test("a rehydrated lock refuses a later screenshot's measurement, exactly like a fresh one", () => {
  const { hydrateLockedBox, inferBox, correctBox } = useChainViewport.getState();
  hydrateLockedBox(BOX);
  inferBox(OTHER_BOX);
  correctBox(OTHER_BOX);

  assert.deepEqual(useChainViewport.getState().viewport, { status: "locked", box: BOX });
});

test("starting a new chain drops a rehydrated lock", () => {
  useChainViewport.getState().hydrateLockedBox(BOX);
  useChainViewport.getState().startNewChain();

  assert.equal(useChainViewport.getState().viewport.status, "unmeasured");
});

// Exercises the direction-card.tsx call site end to end: `lockedBoxOf(viewport)` feeding
// `resolveComparisonViewport` as the chain actually locks, not just the two functions in
// isolation with hand-built inputs.
test("the comparison view falls back to the screenshot size until the chain locks, then switches to the lock", () => {
  const { inferBox, lockBox } = useChainViewport.getState();
  const screenshotDimensions = OTHER_BOX;

  inferBox(screenshotDimensions);
  const beforeLock = resolveComparisonViewport({
    lockedViewport: lockedBoxOf(useChainViewport.getState().viewport),
    screenshotDimensions,
  });
  assert.deepEqual(beforeLock, screenshotDimensions);

  lockBox();
  const afterLock = resolveComparisonViewport({
    lockedViewport: lockedBoxOf(useChainViewport.getState().viewport),
    screenshotDimensions,
  });
  assert.deepEqual(afterLock, screenshotDimensions);

  // A later round's screenshot no longer moves the comparison box: the lock from the chain's
  // first commit outranks it, exactly like `direction-card.tsx` renders for every round after.
  const laterRoundScreenshot = BOX;
  const laterRound = resolveComparisonViewport({
    lockedViewport: lockedBoxOf(useChainViewport.getState().viewport),
    screenshotDimensions: laterRoundScreenshot,
  });
  assert.deepEqual(laterRound, screenshotDimensions);
});
