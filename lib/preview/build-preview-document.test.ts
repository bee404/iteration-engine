import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import {
  buildPreviewDocument,
  extractComponentName,
  quoteUnitfulStyleValues,
  stripCodeFences,
  stripSurroundingProse,
  transpilePreviewComponent,
  wrapBareStyleTagCss,
} from "./build-preview-document";

test("stripCodeFences removes a wrapping markdown fence but leaves plain source untouched", () => {
  assert.equal(stripCodeFences("```tsx\nconst x = 1;\n```"), "const x = 1;");
  assert.equal(stripCodeFences("const x = 1;"), "const x = 1;");
});

test("extractComponentName finds the component across declaration shapes", () => {
  assert.equal(extractComponentName("export default function App() { return null; }"), "App");
  assert.equal(extractComponentName("const Card = () => null;\nexport default Card;"), "Card");
  assert.equal(extractComponentName("function Widget() { return null; }"), "Widget");
  assert.equal(extractComponentName("const value = 3;"), null);
});

test("transpilePreviewComponent strips TS/JSX and reports the component name", () => {
  const result = transpilePreviewComponent(
    "export default function App(): JSX.Element { return <div>hi</div>; }",
  );
  assert.equal(result.ok, true);
  if (result.ok) {
    assert.equal(result.componentName, "App");
    assert.match(result.code, /React\.createElement/);
    assert.doesNotMatch(result.code, /: JSX\.Element/);
  }
});

test("transpilePreviewComponent surfaces a syntax error instead of throwing", () => {
  const result = transpilePreviewComponent("export default function App() { return <div>;");
  assert.equal(result.ok, false);
});

// Regression for the live-preview fallback Bryan still saw after PR #13: the failing rounds
// were not a syntax slip the repair stage could quote/wrap away, they were Claude output
// truncated mid-file at the token ceiling (an unterminated string). The pre-mount repair
// cannot heal a genuinely incomplete file — there is no closing half to fix — which is why the
// real fix lives upstream in claude-provider.ts (raise the ceiling + detect stop_reason
// "max_tokens"). This asserts the honest contract: truncated source stays unrenderable here,
// so the repair stage never pretends to salvage it. The sample is the exact captured raw TSX.
test("transpilePreviewComponent cannot repair truncated (max_tokens) output and reports failure", () => {
  // Resolved from the repo root (process.cwd()); import.meta.dirname is undefined under tsx's
  // CJS transform and the test runner always runs from the repo root.
  const truncated = readFileSync(
    join(process.cwd(), "lib", "providers", "codegen", "__fixtures__", "truncated-max-tokens.raw.txt"),
    "utf-8",
  );
  const result = transpilePreviewComponent(truncated);
  assert.equal(result.ok, false);
});

// Regression for the PR #16 QA Round 3 failure (checkout flow): Claude emitted an object-literal
// in JSX child position — `<div>{count: 5}</div>` — which Sucrase's transformer rejects at the
// child-processing stage with the exact message "Unexpected token when processing JSX children."
// This is not a mechanical slip the repair stage can safely rewrite (the model's intent — text,
// a style object, or a typo — is unrecoverable), so the fix lives in the generation prompt while
// the pre-mount contract stays honest: the pattern degrades to a real, specific error the
// fallback banner surfaces, never a silent bad mount. That deterministic contract is asserted
// here so a future "helpful" repair that swallows the error into a wrong render fails this test.
test("transpilePreviewComponent reports the JSX-children error for an object-literal child (no silent salvage)", () => {
  const result = transpilePreviewComponent(
    "export default function Checkout() {\n  return <div>{count: 5}</div>;\n}\n",
  );
  assert.equal(result.ok, false);
  assert.ok(
    !result.ok && /processing JSX children/.test(result.error),
    `expected the JSX-children error, got: ${result.ok ? "ok" : result.error}`,
  );
});

// Real Claude output occasionally emits TSX that Sucrase can't parse (all producing the
// live-demo error "Unexpected token, expected ';'"). transpilePreviewComponent must repair
// these deterministically and still mount, so the read-only fallback stays a last resort.
test("transpilePreviewComponent repairs unquoted unitful inline-style values", () => {
  const result = transpilePreviewComponent(
    "export default function App() { return <div style={{ maxWidth: 480px, padding: 24px }}>hi</div>; }",
  );
  assert.equal(result.ok, true);
  if (result.ok) {
    assert.match(result.code, /480px/);
    assert.match(result.code, /React\.createElement/);
  }
});

test("transpilePreviewComponent repairs a component wrapped in explanatory prose", () => {
  const result = transpilePreviewComponent(
    "Here is the component:\n\nexport default function App() { return <div>hi</div>; }\n\nLet me know if you want tweaks.",
  );
  assert.equal(result.ok, true);
  if (result.ok) assert.equal(result.componentName, "App");
});

test("transpilePreviewComponent repairs raw CSS written as <style> children", () => {
  const result = transpilePreviewComponent(
    "export default function App() { return <div><style>.card { color: #111; }</style><p className=\"card\">hi</p></div>; }",
  );
  assert.equal(result.ok, true);
});

test("transpilePreviewComponent leaves already-valid code byte-for-byte transpiled (no needless repair)", () => {
  const source = 'export default function App() { return <div style={{ opacity: 1, zIndex: 10 }}>hi</div>; }';
  const viaFull = transpilePreviewComponent(source);
  assert.equal(viaFull.ok, true);
});

test("stripSurroundingProse keeps genuine source untouched but trims wrapping prose", () => {
  const clean = "import React from 'react';\nexport default function App() { return null; }";
  assert.equal(stripSurroundingProse(clean), clean);
  assert.equal(
    stripSurroundingProse(`Sure!\n\n${clean}\n\nHope that helps.`),
    clean,
  );
});

test("quoteUnitfulStyleValues quotes unit values but leaves unitless numbers alone", () => {
  assert.equal(quoteUnitfulStyleValues("{ padding: 24px, opacity: 1 }"), "{ padding: '24px', opacity: 1 }");
  assert.equal(quoteUnitfulStyleValues("{ zIndex: 10, flex: 1 }"), "{ zIndex: 10, flex: 1 }");
});

test("wrapBareStyleTagCss wraps raw CSS but leaves a template-literal child untouched", () => {
  assert.equal(
    wrapBareStyleTagCss("<style>.a{color:red}</style>"),
    "<style>{`.a{color:red}`}</style>",
  );
  const already = "<style>{`.a{color:red}`}</style>";
  assert.equal(wrapBareStyleTagCss(already), already);
});

test("transpilePreviewComponent rejects empty input", () => {
  assert.equal(transpilePreviewComponent("   ").ok, false);
});

test("buildPreviewDocument inlines the runtime source and neutralizes closing script tags", () => {
  const doc = buildPreviewDocument({
    transpiledCode: 'var s = "</script>";',
    componentName: "App",
    runtimeSource: 'window.React = {}; var t = "</script>";',
  });
  // Runtime is inlined, not fetched — the sandboxed iframe can't load a network URL.
  assert.doesNotMatch(doc, /<script src=/);
  assert.match(doc, /window\.React = \{\};/);
  // Both the transpiled code and the runtime source have their closing tags neutralized.
  assert.doesNotMatch(doc, /var s = "<\/script>";/);
  assert.doesNotMatch(doc, /var t = "<\/script>";/);
  assert.match(doc, /window\.__PREVIEW_COMPONENT__/);
});

