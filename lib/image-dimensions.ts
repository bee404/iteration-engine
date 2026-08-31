import type { ImageDimensions } from "@/lib/types";

const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a] as const;
const METERS_PER_INCH = 0.0254;

/**
 * macOS screenshots encode their backing scale in PNG pHYs metadata: 72 DPI is 1x, 144 DPI is
 * 2x, and so on. Browsers expose only natural raster pixels, so reading that metadata is how a
 * 2880px Retina capture becomes a 1440 CSS-pixel viewport instead of a 2880px layout that is
 * subsequently shrunk to half-size.
 *
 * Only integer multiples of the macOS 72-DPI baseline are accepted. Generic 96-DPI exports stay
 * at 1x because their density is print metadata, not evidence of a browser backing scale.
 */
export function pngBackingScale(buffer: ArrayBuffer): number {
  const bytes = new Uint8Array(buffer);
  if (bytes.length < PNG_SIGNATURE.length) return 1;
  if (!PNG_SIGNATURE.every((value, index) => bytes[index] === value)) return 1;

  const view = new DataView(buffer);
  let offset: number = PNG_SIGNATURE.length;
  while (offset + 12 <= bytes.length) {
    const length = view.getUint32(offset);
    const dataOffset = offset + 8;
    const nextOffset = dataOffset + length + 4;
    if (nextOffset > bytes.length) return 1;

    const type = String.fromCharCode(...bytes.slice(offset + 4, offset + 8));
    if (type === "pHYs" && length === 9 && bytes[dataOffset + 8] === 1) {
      const pixelsPerMeterX = view.getUint32(dataOffset);
      const pixelsPerMeterY = view.getUint32(dataOffset + 4);
      if (!pixelsPerMeterX || Math.abs(pixelsPerMeterX - pixelsPerMeterY) / pixelsPerMeterX > 0.02) {
        return 1;
      }

      const dpi = pixelsPerMeterX * METERS_PER_INCH;
      const candidate = Math.round(dpi / 72);
      return candidate >= 2 && candidate <= 4 && Math.abs(dpi - candidate * 72) <= 2 ? candidate : 1;
    }

    offset = nextOffset;
  }
  return 1;
}

export function cssViewportDimensions(
  raster: ImageDimensions | null,
  backingScale: number,
): ImageDimensions | null {
  if (!raster) return null;
  const scale = Number.isFinite(backingScale) && backingScale >= 1 ? backingScale : 1;
  return {
    width: Math.max(1, Math.round(raster.width / scale)),
    height: Math.max(1, Math.round(raster.height / scale)),
  };
}

/** Reads enough of a PNG File to find its pHYs chunk without decoding the full raster twice. */
export async function readPngBackingScale(file: File): Promise<number> {
  if (file.type !== "image/png") return 1;
  return pngBackingScale(await file.slice(0, 64 * 1024).arrayBuffer());
}

/**
 * Reads a raster image's natural pixel size from a data/object URL by decoding it in the
 * browser. Resolves null if the image can't be decoded (e.g. an unsupported or corrupt file)
 * rather than rejecting, so a failed dimension read never blocks the upload flow. Browser-only
 * (uses the Image constructor); callers run it from client components.
 */
export function readImageDimensions(source: string): Promise<ImageDimensions | null> {
  return new Promise((resolve) => {
    const image = new Image();
    image.onload = () => resolve({ width: image.naturalWidth, height: image.naturalHeight });
    image.onerror = () => resolve(null);
    image.src = source;
  });
}
