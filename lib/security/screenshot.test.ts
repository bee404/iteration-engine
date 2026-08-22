import assert from "node:assert/strict";
import test from "node:test";
import {
  MAX_SCREENSHOT_BYTES,
  ScreenshotValidationError,
  resolveScreenshotDataUrl,
} from "./screenshot";

test("accepts supported browser-uploaded image data URLs", () => {
  assert.deepEqual(resolveScreenshotDataUrl("data:image/png;base64,aGVsbG8="), {
    mediaType: "image/png",
    base64Data: "aGVsbG8=",
  });
});

test("rejects remote URLs to prevent server-side request forgery", () => {
  assert.throws(
    () => resolveScreenshotDataUrl("https://example.com/screenshot.png"),
    (error) => error instanceof ScreenshotValidationError && /remote image URLs/.test(error.message),
  );
});

test("rejects unsupported media types and malformed base64", () => {
  assert.throws(() => resolveScreenshotDataUrl("data:image/svg+xml;base64,PHN2Zz4="), ScreenshotValidationError);
  assert.throws(() => resolveScreenshotDataUrl("data:image/png;base64,not valid"), ScreenshotValidationError);
});

test("rejects decoded images above the upload limit", () => {
  const oversizedBase64 = Buffer.alloc(MAX_SCREENSHOT_BYTES + 1).toString("base64");
  assert.throws(
    () => resolveScreenshotDataUrl(`data:image/png;base64,${oversizedBase64}`),
    (error) => error instanceof ScreenshotValidationError && /upload limit/.test(error.message),
  );
});
