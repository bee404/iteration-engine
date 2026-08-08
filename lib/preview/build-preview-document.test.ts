import assert from "node:assert/strict";
import { test } from "node:test";
import {
  buildPreviewDocument,
  extractComponentName,
  stripCodeFences,
  transpilePreviewComponent,
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

test("transpilePreviewComponent rejects empty input", () => {
  assert.equal(transpilePreviewComponent("   ").ok, false);
});

test("buildPreviewDocument embeds the runtime url and neutralizes closing script tags", () => {
  const doc = buildPreviewDocument({
    transpiledCode: 'var s = "</script>";',
    componentName: "App",
    runtimeUrl: "https://example.test/preview-runtime/react-globals.js",
  });
  assert.match(doc, /src="https:\/\/example\.test\/preview-runtime\/react-globals\.js"/);
  assert.doesNotMatch(doc, /var s = "<\/script>";/);
  assert.match(doc, /window\.__PREVIEW_COMPONENT__/);
});

