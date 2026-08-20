/**
 * Shared browser rasterisation for the screenshot analysers. Both the chrome-trimming preprocessor
 * and the edge-colour detector need the same thing: decode a data URL, then measure a low-res raster
 * of it rather than the full-size bitmap.
 */

/** The subset of `ImageData` the pure analysers read, so they can be unit-tested without a canvas. */
export interface Raster {
  data: Uint8ClampedArray;
  width: number;
  height: number;
}

export function decodeImage(source: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("decode failed"));
    image.src = source;
  });
}

/** Longest-side-bounded dimensions for the raster we analyse, preserving aspect ratio. */
export function analysisSize(width: number, height: number, maxSide: number): { width: number; height: number } {
  const scale = Math.min(1, maxSide / Math.max(width, height));
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  };
}

export function rasterize(image: HTMLImageElement, width: number, height: number): Raster | null {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return null;
  ctx.drawImage(image, 0, 0, width, height);
  return ctx.getImageData(0, 0, width, height);
}

