import assert from "node:assert/strict";
import { test } from "node:test";

import { getDesignSystemById } from "@/lib/design-systems";
import { postProcessGeneratedCode } from "./postprocess";

const SOURCE_CODE = [
  "```tsx",
  "const App = () => (",
  "  <div style={{ background: '#071014', color: '#b9f3ff', fontFamily: 'Geist' }}>",
  "    <span>→</span>",
  "  </div>",
  ");",
  "export default App;",
  "```",
].join("\n");

test("source-preserving postprocess leaves source colors and fonts untouched", () => {
  const { code, warnings } = postProcessGeneratedCode(SOURCE_CODE);

  assert.match(code, /#071014/);
  assert.match(code, /#b9f3ff/);
  assert.doesNotMatch(code, /ie-ds-geist-font/);
  assert.doesNotMatch(code, /```/);
  assert.ok(warnings.some((warning) => warning.kind === "emoji_icon"));
  assert.ok(!warnings.some((warning) => warning.kind === "off_palette_color"));
});

test("explicit Geist mode opts into palette rewriting and font injection", () => {
  const designSystem = getDesignSystemById("vercel-geist");
  assert.ok(designSystem);

  const { code, warnings } = postProcessGeneratedCode(SOURCE_CODE, { designSystem });

  assert.doesNotMatch(code, /#071014/i);
  assert.doesNotMatch(code, /#b9f3ff/i);
  assert.match(code, /ie-ds-geist-font/);
  assert.ok(warnings.some((warning) => warning.kind === "off_palette_color"));
});
