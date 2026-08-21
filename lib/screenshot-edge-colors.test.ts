import assert from "node:assert/strict";
import { test } from "node:test";

import { detectVerticalColorSplit, toCssColor, type RgbColor } from "./screenshot-edge-colors";
import type { Raster } from "./screenshot-raster";

const GRAY: RgbColor = { r: 243, g: 243, b: 243 };
const WHITE: RgbColor = { r: 255, g: 255, b: 255 };

/** Builds a raster from a per-pixel colour function, mirroring canvas RGBA layout. */
function raster(width: number, height: number, at: (x: number, y: number) => RgbColor): Raster {
  const data = new Uint8ClampedArray(width * height * 4);
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const { r, g, b } = at(x, y);
      const offset = (y * width + x) * 4;
      data[offset] = r;
      data[offset + 1] = g;
      data[offset + 2] = b;
      data[offset + 3] = 255;
    }
  }
  return { data, width, height };
}

/** A sidebar-style UI: flat colour left of `split`, flat colour right of it. */
function sidebar(width: number, height: number, split: number): Raster {
  return raster(width, height, (x) => (x < width * split ? GRAY : WHITE));
}

test("detects a sidebar split and reports its boundary and zone colours", () => {
  const result = detectVerticalColorSplit(sidebar(400, 300, 0.18));

  assert.ok(result, "expected a split");
  assert.equal(result.boundary, 0.18);
  assert.deepEqual(result.leading, { r: 242, g: 242, b: 242 });
  assert.deepEqual(result.trailing, { r: 254, g: 254, b: 254 });
});

test("ignores a thin capture margin and finds the zones behind it", () => {
  // Mock-up exports often carry a decorative outer margin plus a card border; neither is a zone.
  const margin: RgbColor = { r: 246, g: 247, b: 249 };
  const withMargin = raster(400, 300, (x) => {
    if (x < 12) return margin;
    return x < 400 * 0.2 ? GRAY : WHITE;
  });

  const result = detectVerticalColorSplit(withMargin);

  assert.ok(result, "expected the margin to be skipped, not to defeat detection");
  assert.equal(result.boundary, 0.2);
  assert.deepEqual(result.leading, { r: 242, g: 242, b: 242 });
});

test("tolerates UI content sitting inside a zone", () => {
  // Cards and text interrupt columns without changing the zone the column belongs to.
  const withContent = raster(400, 300, (x, y) => {
    const base = x < 400 * 0.18 ? GRAY : WHITE;
    const inCard = x > 160 && x < 360 && y > 80 && y < 120;
    return inCard ? { r: 20, g: 20, b: 20 } : base;
  });

  const result = detectVerticalColorSplit(withContent);

  assert.ok(result, "expected content inside a zone not to break the split");
  assert.equal(result.boundary, 0.18);
});

test("returns null for a uniform background", () => {
  assert.equal(detectVerticalColorSplit(raster(400, 300, () => WHITE)), null);
});

test("returns null for a gradient rather than inventing a boundary", () => {
  const gradient = raster(400, 300, (x) => {
    const v = Math.round((x / 399) * 255);
    return { r: v, g: v, b: 200 };
  });

  assert.equal(detectVerticalColorSplit(gradient), null);
});

test("returns null for a busy photographic image", () => {
  let seed = 7;
  const nextByte = () => {
    seed = (seed * 1103515245 + 12345) % 2147483648;
    return seed % 256;
  };
  const noise = raster(400, 300, () => ({ r: nextByte(), g: nextByte(), b: nextByte() }));

  assert.equal(detectVerticalColorSplit(noise), null);
});

test("returns null when the two zones are too close in colour to read as a split", () => {
  const nearlyUniform = raster(400, 300, (x) =>
    x < 80 ? { r: 252, g: 252, b: 252 } : { r: 255, g: 255, b: 255 },
  );

  assert.equal(detectVerticalColorSplit(nearlyUniform), null);
});

test("returns null when a third zone means the image is not a simple split", () => {
  const threeZones = raster(400, 300, (x) => {
    if (x < 100) return GRAY;
    if (x < 260) return WHITE;
    return { r: 200, g: 210, b: 230 };
  });

  assert.equal(detectVerticalColorSplit(threeZones), null);
});

test("returns null for a degenerate raster", () => {
  assert.equal(detectVerticalColorSplit(raster(1, 1, () => WHITE)), null);
});

test("toCssColor emits a css rgb() value", () => {
  assert.equal(toCssColor({ r: 243, g: 244, b: 245 }), "rgb(243 244 245)");
});
