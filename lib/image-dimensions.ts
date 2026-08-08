import type { ImageDimensions } from "@/lib/types";

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

