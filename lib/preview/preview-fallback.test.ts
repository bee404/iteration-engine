import assert from "node:assert/strict";
import { test } from "node:test";
import { errorFallbackNotice, PREVIEW_FALLBACK_PREFIX } from "./preview-fallback";

// Regression for the PR #16 QA "silent stall": a generation that ended in error status used to
// render the read-only source view with no banner, so a truncated_response looked like nothing
// went wrong. errorFallbackNotice guarantees the error status always resolves to a banner.

test("errorFallbackNotice surfaces the typed error behind the fallback banner", () => {
  const notice = errorFallbackNotice(
    "error",
    "Claude hit the output-token limit and stopped before the component was complete.",
  );
  assert.ok(notice, "error status must always produce a banner");
  assert.ok(notice.startsWith(PREVIEW_FALLBACK_PREFIX));
  assert.match(notice, /output-token limit/);
});

test("errorFallbackNotice still banners when the error message is missing or blank", () => {
  for (const blank of [undefined, "", "   "]) {
    const notice = errorFallbackNotice("error", blank);
    assert.ok(notice, "a bannerless error must never be possible");
    assert.ok(notice.startsWith(PREVIEW_FALLBACK_PREFIX));
    assert.match(notice, /nothing to mount/);
  }
});

test("errorFallbackNotice stays out of the way for non-error statuses", () => {
  // Streaming shows plain source (with a spinner); complete is handled by the live mount, which
  // builds its own transpile/mount notices. Only "error" is the previously-silent path.
  assert.equal(errorFallbackNotice("streaming", undefined), null);
  assert.equal(errorFallbackNotice("complete", undefined), null);
});

