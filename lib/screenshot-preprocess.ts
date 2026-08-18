import type { ImageDimensions } from "@/lib/types";

export interface PreprocessedScreenshot {
  /** Cropped PNG data URL when trimming happened, otherwise the source URL untouched. */
  dataUrl: string;
  dimensions: ImageDimensions;
  /** True when non-UI chrome/padding was trimmed away. */
  cropped: boolean;
}

const ANALYSIS_MAX = 480; // longest side of the low-res raster we measure against
const UNIFORM_TOL = 16; // per-channel spread (0-255) below which a scan line reads as "flat"
const SAMPLES = 160; // pixels sampled along each scan line
const MAX_TRIM_TOP = 0.3; // browser/OS chrome may eat at most 30% off the top
const MAX_TRIM_SIDE = 0.45; // letterbox/padding cap for the other three edges
const MIN_KEEP_AREA = 0.35; // never crop away more than 65% of the frame

/**
 * Detects and trims non-UI visual noise from an uploaded screenshot so the reference container on
 * /feedback shows a pristine interface, not the browser toolbar, OS window frame, or letterbox
 * padding a full-screen capture carries in.
 *
 * The heuristic is deliberately conservative: it trims a run of consecutive *near-uniform* scan
 * lines inward from each edge and stops at the first line carrying real detail. That cleanly removes
 * solid margins, letterbox bars, and the flat colour bands a browser chrome strip is usually made of,
 * while leaving genuine UI (which is almost never uniform across a full line) intact. It is not a
 * pixel-perfect chrome classifier — when in doubt it keeps pixels rather than risk clipping the UI.
 *
 * Browser-only (uses canvas + the Image constructor); callers run it from client components. On any
 * failure it resolves with the original image so a bad decode never blocks the upload flow.
 */
export async function preprocessScreenshot(source: string): Promise<PreprocessedScreenshot> {
  if (typeof document === "undefined") {
    return { dataUrl: source, dimensions: { width: 0, height: 0 }, cropped: false };
  }

  try {
    const image = await decode(source);
    const naturalWidth = image.naturalWidth;
    const naturalHeight = image.naturalHeight;
    if (!naturalWidth || !naturalHeight) {
      return { dataUrl: source, dimensions: { width: 0, height: 0 }, cropped: false };
    }

    const scale = Math.min(1, ANALYSIS_MAX / Math.max(naturalWidth, naturalHeight));
    const aw = Math.max(1, Math.round(naturalWidth * scale));
    const ah = Math.max(1, Math.round(naturalHeight * scale));

    const analysis = drawTo(image, aw, ah);
    if (!analysis) return fallback(source, naturalWidth, naturalHeight);
    const { data } = analysis;

    // Fractions [0,1] of the analysis raster that are trimmable chrome/padding on each edge.
    const top = trimEdge((i) => rowUniform(data, aw, ah, i), ah, MAX_TRIM_TOP);
    const bottom = trimEdge((i) => rowUniform(data, aw, ah, ah - 1 - i), ah, MAX_TRIM_SIDE);
    const left = trimEdge((i) => colUniform(data, aw, ah, i), aw, MAX_TRIM_SIDE);
    const right = trimEdge((i) => colUniform(data, aw, ah, aw - 1 - i), aw, MAX_TRIM_SIDE);

    const keepW = 1 - (left + right) / aw;
    const keepH = 1 - (top + bottom) / ah;
    const trimmed = top + bottom + left + right > 0;
    if (!trimmed || keepW * keepH < MIN_KEEP_AREA) {
      return fallback(source, naturalWidth, naturalHeight);
    }

    // Map the analysis-space crop rect back onto the full-resolution image.
    const sx = Math.round((left / aw) * naturalWidth);
    const sy = Math.round((top / ah) * naturalHeight);
    const sw = naturalWidth - sx - Math.round((right / aw) * naturalWidth);
    const sh = naturalHeight - sy - Math.round((bottom / ah) * naturalHeight);
    if (sw <= 0 || sh <= 0) return fallback(source, naturalWidth, naturalHeight);

    const canvas = document.createElement("canvas");
    canvas.width = sw;
    canvas.height = sh;
    const ctx = canvas.getContext("2d");
    if (!ctx) return fallback(source, naturalWidth, naturalHeight);
    ctx.drawImage(image, sx, sy, sw, sh, 0, 0, sw, sh);

    return { dataUrl: canvas.toDataURL("image/png"), dimensions: { width: sw, height: sh }, cropped: true };
  } catch {
    return { dataUrl: source, dimensions: { width: 0, height: 0 }, cropped: false };
  }
}

function decode(source: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("decode failed"));
    image.src = source;
  });
}

function drawTo(image: HTMLImageElement, w: number, h: number): ImageData | null {
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return null;
  ctx.drawImage(image, 0, 0, w, h);
  return ctx.getImageData(0, 0, w, h);
}

/** Counts trimmable lines inward from one edge, stopping at the first line with real detail. */
function trimEdge(isUniform: (index: number) => boolean, length: number, cap: number): number {
  const limit = Math.floor(length * cap);
  let trimmed = 0;
  while (trimmed < limit && isUniform(trimmed)) trimmed += 1;
  return trimmed;
}

function rowUniform(data: Uint8ClampedArray, w: number, h: number, y: number): boolean {
  if (y < 0 || y >= h) return false;
  const step = Math.max(1, Math.floor(w / SAMPLES));
  return lineUniform(data, (x) => (y * w + x) * 4, w, step);
}

function colUniform(data: Uint8ClampedArray, w: number, h: number, x: number): boolean {
  if (x < 0 || x >= w) return false;
  const step = Math.max(1, Math.floor(h / SAMPLES));
  return lineUniform(data, (y) => (y * w + x) * 4, h, step);
}

/** True when every sampled pixel on a scan line sits within UNIFORM_TOL of the line's min/max. */
function lineUniform(
  data: Uint8ClampedArray,
  offsetAt: (pos: number) => number,
  count: number,
  step: number,
): boolean {
  let minR = 255;
  let minG = 255;
  let minB = 255;
  let maxR = 0;
  let maxG = 0;
  let maxB = 0;
  for (let pos = 0; pos < count; pos += step) {
    const o = offsetAt(pos);
    const r = data[o] ?? 0;
    const g = data[o + 1] ?? 0;
    const b = data[o + 2] ?? 0;
    if (r < minR) minR = r;
    if (g < minG) minG = g;
    if (b < minB) minB = b;
    if (r > maxR) maxR = r;
    if (g > maxG) maxG = g;
    if (b > maxB) maxB = b;
    if (maxR - minR > UNIFORM_TOL || maxG - minG > UNIFORM_TOL || maxB - minB > UNIFORM_TOL) {
      return false;
    }
  }
  return count > 0;
}

function fallback(source: string, width: number, height: number): PreprocessedScreenshot {
  return { dataUrl: source, dimensions: { width, height }, cropped: false };
}

