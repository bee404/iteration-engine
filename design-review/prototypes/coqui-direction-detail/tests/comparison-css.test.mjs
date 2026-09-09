import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("the fixed comparison frame preserves the generated app desktop grid", async () => {
  const css = await readFile(new URL("../src/styles.css", import.meta.url), "utf8");

  assert.match(css, /\.generated-app\s*\{[^}]*display:\s*grid;/s);
  assert.doesNotMatch(
    css,
    /\.comparison-frame\s*>\s*\.generated-app\s*\{[^}]*display:\s*block;/s,
  );
});
