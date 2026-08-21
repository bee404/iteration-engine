export const MAX_SCREENSHOT_BYTES = 3 * 1024 * 1024;

export type SupportedImageMediaType = "image/png" | "image/jpeg" | "image/gif" | "image/webp";

const SUPPORTED_IMAGE_MEDIA_TYPES: ReadonlySet<string> = new Set([
  "image/png",
  "image/jpeg",
  "image/gif",
  "image/webp",
]);

export interface ResolvedScreenshot {
  mediaType: SupportedImageMediaType;
  base64Data: string;
}

export class ScreenshotValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ScreenshotValidationError";
  }
}

/**
 * Accepts only browser-uploaded image data URLs. Remote URLs are intentionally rejected so a
 * caller cannot make the server probe internal services (SSRF). The decoded-size check happens
 * before decoding so oversized payloads are rejected without allocating another large buffer.
 */
export function resolveScreenshotDataUrl(screenshotRef: string): ResolvedScreenshot {
  if (!screenshotRef.startsWith("data:")) {
    throw new ScreenshotValidationError(
      "screenshotRef must be a browser-uploaded base64 image data URL; remote image URLs are not accepted.",
    );
  }

  const match = /^data:([^;,]+);base64,([A-Za-z0-9+/]*={0,2})$/s.exec(screenshotRef);
  if (!match) {
    throw new ScreenshotValidationError("screenshotRef is not valid base64-encoded image data.");
  }

  const mediaType = match[1];
  const base64Data = match[2];
  if (!mediaType || !base64Data || !SUPPORTED_IMAGE_MEDIA_TYPES.has(mediaType)) {
    throw new ScreenshotValidationError("screenshotRef must contain a PNG, JPEG, GIF, or WebP image.");
  }
  if (base64Data.length % 4 !== 0) {
    throw new ScreenshotValidationError("screenshotRef contains malformed base64 image data.");
  }

  const padding = base64Data.endsWith("==") ? 2 : base64Data.endsWith("=") ? 1 : 0;
  const decodedBytes = (base64Data.length / 4) * 3 - padding;
  if (decodedBytes > MAX_SCREENSHOT_BYTES) {
    throw new ScreenshotValidationError(
      `Screenshot exceeds the ${MAX_SCREENSHOT_BYTES / 1024 / 1024} MB upload limit.`,
    );
  }

  return { mediaType: mediaType as SupportedImageMediaType, base64Data };
}
