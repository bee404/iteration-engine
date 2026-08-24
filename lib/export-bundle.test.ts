import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import { strFromU8, unzipSync } from "fflate";
import { buildExportBundle } from "./export-bundle";
import { extractInlinedFont } from "./export-inlined-font";
import { ensureFontFace } from "./providers/codegen/postprocess";

const FONT_ASSET = join(process.cwd(), "lib", "design-systems", "assets", "Geist-Variable.woff2");

/** A minimal generated component that references Geist, so ensureFontFace injects for real. */
const RAW_COMPONENT = `function ApprovedDirection() {
  return <div style={{ fontFamily: "Geist, sans-serif" }}>Approved</div>;
}
`;

function generatedCodeWithInlinedFont(): string {
  const code = ensureFontFace(RAW_COMPONENT);
  assert.notEqual(code, RAW_COMPONENT, "fixture precondition: the font injector must have run");
  return code;
}

function unzipBundle(code: string): Record<string, Uint8Array> {
  const bundle = buildExportBundle({
    direction: { title: "Make the next action unmistakable" },
    code,
    designGoal: "Clarify the primary action",
  });
  assert.equal(bundle.fileName, "make-the-next-action-unmistakable.zip");
  return unzipSync(bundle.bytes);
}

/** Reads a bundle entry that must exist, so a missing file fails as itself, not as a type error. */
function entry(files: Record<string, Uint8Array>, path: string): Uint8Array {
  const bytes = files[path];
  assert.ok(bytes !== undefined, `bundle is missing ${path}`);
  return bytes;
}

test("exported component source carries no inlined base64 font", () => {
  const generated = generatedCodeWithInlinedFont();
  assert.ok(generated.length > 80_000, "fixture precondition: inlined source is large");

  const files = unzipBundle(generated);
  const component = strFromU8(entry(files, "src/ApprovedDirection.tsx"));

  assert.ok(!component.includes("base64"), "component must not contain a base64 payload");
  assert.ok(!component.includes("ie-ds-geist-font"), "font injector block must be stripped");
  assert.ok(component.length < 4_000, `component should be small, got ${component.length} bytes`);
  assert.ok(component.includes("ApprovedDirection"), "component body must survive stripping");
  assert.ok(component.includes("export default ApprovedDirection"));
});

test("the font ships as a real asset the entry point imports", () => {
  const files = unzipBundle(generatedCodeWithInlinedFont());

  const stylesheet = strFromU8(entry(files, "src/fonts.css"));
  assert.ok(stylesheet.includes(`url("./assets/Geist.woff2") format("woff2")`));
  assert.ok(stylesheet.includes("font-weight: 100 900"), "descriptors must survive the rewrite");
  assert.ok(!stylesheet.includes("data:font"), "the src must be a file, not a data URI");

  // Byte-identical to the woff2 the pipeline inlined, so the export renders the same face.
  assert.deepEqual(Buffer.from(entry(files, "src/assets/Geist.woff2")), readFileSync(FONT_ASSET));

  assert.ok(strFromU8(entry(files, "src/main.tsx")).includes(`import "./fonts.css";`));
  assert.ok(strFromU8(entry(files, "README.md")).includes("src/assets/Geist.woff2"));
});

test("code with no inlined font is exported untouched and gains no font files", () => {
  const files = unzipBundle(RAW_COMPONENT);

  assert.equal(files["src/fonts.css"], undefined);
  assert.equal(files["src/assets/Geist.woff2"], undefined);
  assert.ok(!strFromU8(entry(files, "src/main.tsx")).includes("fonts.css"));
  assert.ok(strFromU8(entry(files, "src/ApprovedDirection.tsx")).includes("Geist, sans-serif"));
});

test("extractInlinedFont leaves source alone when the payload is unreadable", () => {
  const corrupted = generatedCodeWithInlinedFont().replace(
    /ieGeistFontStyle\.textContent = "[\s\S]*?";/,
    "ieGeistFontStyle.textContent = someRuntimeValue;",
  );

  const result = extractInlinedFont(corrupted);

  assert.equal(result.code, corrupted, "a block we cannot decode must not be half-stripped");
  assert.equal(result.asset, null);
  assert.equal(result.stylesheet, null);
});
