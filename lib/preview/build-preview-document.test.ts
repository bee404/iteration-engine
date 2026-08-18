import assert from "node:assert/strict";
import { test } from "node:test";
import {
  buildPreviewDocument,
  buildStreamingSourceDocument,
  extractComponentName,
  nextStreamingSourceMessage,
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



test("nextStreamingSourceMessage appends only the newly streamed suffix", () => {
  assert.deepEqual(nextStreamingSourceMessage("const a", "const app"), {
    type: "preview-src-append",
    chunk: "pp",
  });
  assert.deepEqual(nextStreamingSourceMessage("", "first"), {
    type: "preview-src-append",
    chunk: "first",
  });
});

test("nextStreamingSourceMessage is a no-op when nothing new streamed", () => {
  assert.equal(nextStreamingSourceMessage("same", "same"), null);
});

test("nextStreamingSourceMessage resets when the buffer is replaced wholesale", () => {
  // The post-processed finalize source can diverge from the raw streamed buffer.
  assert.deepEqual(nextStreamingSourceMessage("raw draft", "clean final"), {
    type: "preview-src-reset",
    text: "clean final",
  });
});

test("streaming source doc is a constant fed incrementally — one document across a whole stream", () => {
  // Simulate a multi-token stream and prove the source of the mid-stream blank-pane frames is
  // gone: the srcDoc never changes across tokens (so the real iframe loads exactly once), and
  // every token produces exactly one in-place append rather than a document rebuild.
  const tokens = ["export ", "default ", "function ", "App() ", "{ return null; }"];
  const docsSeen = new Set<string>();
  const messageTypes: string[] = [];

  let rendered = "";
  let code = "";
  for (const token of tokens) {
    docsSeen.add(buildStreamingSourceDocument()); // what React would pass as srcDoc each render
    code += token;
    const message = nextStreamingSourceMessage(rendered, code);
    assert.ok(message, "each token must yield an update");
    messageTypes.push(message.type);
    rendered = code;
  }

  assert.equal(docsSeen.size, 1, "the streaming document is constant — a single iframe load per session");
  assert.deepEqual(messageTypes, tokens.map(() => "preview-src-append"), "every token is an in-place append, never a rebuild");
  assert.equal(rendered, "export default function App() { return null; }");
});

test("streaming source document ships an empty mount point and never inlines token text", () => {
  const doc = buildStreamingSourceDocument();
  assert.match(doc, /<pre id="preview-src"><\/pre>/); // empty mount point, no baked-in code
  assert.match(doc, /addEventListener\("message"/); // listener present for incremental updates
  assert.match(doc, /textContent/); // updates via textContent, so streamed source can't inject markup
});
