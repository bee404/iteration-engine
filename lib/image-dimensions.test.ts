import assert from "node:assert/strict";
import { test } from "node:test";

import { cssViewportDimensions, pngBackingScale } from "./image-dimensions";

function pngWithDensity(dpi: number): ArrayBuffer {
  const signature = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
  const bytes = new Uint8Array(8 + 4 + 4 + 9 + 4);
  bytes.set(signature, 0);
  const view = new DataView(bytes.buffer);
  view.setUint32(8, 9);
  bytes.set([0x70, 0x48, 0x59, 0x73], 12);
  const pixelsPerMeter = Math.round(dpi / 0.0254);
  view.setUint32(16, pixelsPerMeter);
  view.setUint32(20, pixelsPerMeter);
  bytes[24] = 1;
  return bytes.buffer;
}

test("reads a macOS Retina PNG as a 2x capture", () => {
  assert.equal(pngBackingScale(pngWithDensity(144)), 2);
});

test("does not reinterpret generic 96-DPI image metadata as browser scale", () => {
  assert.equal(pngBackingScale(pngWithDensity(96)), 1);
});

test("converts Retina raster pixels into the CSS viewport used for generation", () => {
  assert.deepEqual(cssViewportDimensions({ width: 2880, height: 2070 }, 2), {
    width: 1440,
    height: 1035,
  });
});

test("leaves ordinary 1x raster dimensions unchanged", () => {
  assert.deepEqual(cssViewportDimensions({ width: 1440, height: 900 }, 1), {
    width: 1440,
    height: 900,
  });
});
