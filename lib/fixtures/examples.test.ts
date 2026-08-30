import assert from "node:assert/strict";
import { test } from "node:test";

import { getActiveFixture } from "./examples";

test("the default demo fixture can generate the shared prototype from every direction", () => {
  const fixture = getActiveFixture();
  const codeByDirection = fixture.directions.map(({ capturedCode }) => capturedCode);

  assert.equal(codeByDirection.length, 3);
  assert.ok(codeByDirection.every((code) => typeof code === "string" && code.length > 0));
  assert.equal(new Set(codeByDirection).size, 1, "all three demo selections should replay the same code");
});
