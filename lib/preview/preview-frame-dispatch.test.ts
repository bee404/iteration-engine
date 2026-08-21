import assert from "node:assert/strict";
import { test } from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { PreviewFrame } from "@/components/preview-frame";
import { PREVIEW_FALLBACK_PREFIX } from "./preview-fallback";

// preview-fallback.test.ts pins the pure decision helper, but the helper is only a guarantee if
// PreviewFrame actually calls it. PR #19 restructured this component's status dispatch into
// explicit `streaming` / `error` / complete branches and its `error` branch returned a bare
// SourceView with no notice — a bannerless failure the helper's own tests could not see. These
// render-level tests pin the wiring, so a future dispatch refactor can't quietly reopen the
// silent stall again.

/** renderToStaticMarkup escapes `'` to `&#x27;`, so decode before matching banner copy. */
function render(props: Parameters<typeof PreviewFrame>[0]): string {
  return renderToStaticMarkup(createElement(PreviewFrame, props))
    .replace(/&#x27;/g, "'")
    .replace(/&quot;/g, '"');
}

const PARTIAL_SOURCE = "export default function Checkout() {\n  return <div className=\"p";

test("PreviewFrame banners an errored generation and names the reason", () => {
  const reason = "Claude hit the output-token limit and stopped before the component was complete.";
  const html = render({ code: PARTIAL_SOURCE, language: "tsx", status: "error", error: reason });
  assert.ok(html.includes(PREVIEW_FALLBACK_PREFIX), "error status must render the fallback banner");
  assert.ok(html.includes(reason), "the banner must carry the typed codegen reason");
});

test("PreviewFrame still banners an errored generation with no error message", () => {
  const html = render({ code: PARTIAL_SOURCE, language: "tsx", status: "error" });
  assert.ok(html.includes(PREVIEW_FALLBACK_PREFIX), "a missing reason must not produce a bannerless view");
});

test("PreviewFrame keeps the streaming incremental-mount view banner-free", () => {
  const html = render({ code: PARTIAL_SOURCE, language: "tsx", status: "streaming" });
  assert.ok(html.includes("Streaming tsx source"), "streaming must use the load-once streaming frame");
  assert.ok(!html.includes(PREVIEW_FALLBACK_PREFIX), "an in-progress stream is not a failure");
});

test("PreviewFrame live-mounts a complete, valid component without a banner", () => {
  const html = render({
    code: "export default function Ok() {\n  return <div>hi</div>;\n}",
    language: "tsx",
    status: "complete",
  });
  assert.ok(html.includes("Live tsx preview"), "a clean complete run must reach the live mount");
  assert.ok(!html.includes(PREVIEW_FALLBACK_PREFIX), "a successful mount must not show the fallback banner");
});
