import assert from "node:assert/strict";
import { afterEach, test } from "node:test";

import { lockedBoxOf, useRoundViewport } from "./round-viewport";

afterEach(() => useRoundViewport.getState().reset());

test("the viewport can be corrected until prototype generation locks it", () => {
  const state = useRoundViewport.getState();
  state.inferBox({ width: 1280, height: 832 });
  state.correctBox({ width: 1440, height: 900 });
  state.lockBox();

  assert.deepEqual(lockedBoxOf(useRoundViewport.getState().viewport), { width: 1440, height: 900 });

  useRoundViewport.getState().correctBox({ width: 320, height: 640 });
  assert.deepEqual(lockedBoxOf(useRoundViewport.getState().viewport), { width: 1440, height: 900 });
});

test("starting another exploration clears the viewport", () => {
  const state = useRoundViewport.getState();
  state.inferBox({ width: 800, height: 600 });
  state.lockBox();
  state.reset();

  assert.deepEqual(useRoundViewport.getState().viewport, { status: "unmeasured" });
});
