import { MAX_SCREENSHOT_BYTES } from "@/lib/security/screenshot";

/**
 * Shrinks a round's screenshot to something `/api/critique` will accept.
 *
 * The reference the user sees on /feedback is the full-resolution capture, and a retina screenshot
 * is routinely 5-8 MB once base64-encoded — well past the route's 3 MB ceiling. Sending the display
 * copy straight to the model would fail every such round with `invalid_screenshot`, so the
 * transmitted copy is encoded separately here. Nothing about the on-screen reference changes.
 *
 * 1568px is also the longest edge Anthropic's vision models actually use; anything larger is
 * downscaled upstream anyway, so this costs no fidelity the model would have seen.
 */
const MAX_EDGE = 1568;

/** Tried in order once PNG is too large. Lossy is strictly better than a rejected round. */
const JPEG_QUALITIES = [0.92, 0.8, 0.65, 0.5];

/** Encoders attempted at each scale: lossless first, then progressively lossier JPEG. */
const ENCODERS: ReadonlyArray<(canvas: HTMLCanvasElement) => string> = [
  (canvas) => canvas.toDataURL("image/png"),
  ...JPEG_QUALITIES.map(
    (quality) => (canvas: HTMLCanvasElement) => canvas.toDataURL("image/jpeg", quality),
  ),
];

/** How many times the whole encoder ladder may be retried at half the previous scale. */
const MAX_SCALE_STEPS = 4;

/** Decoded byte count of a base64 data URL, matching the server's own pre-decode check. */
function decodedBytes(dataUrl: string): number {
  const base64 = dataUrl.slice(dataUrl.indexOf(",") + 1);
  const padding = base64.endsWith("==") ? 2 : base64.endsWith("=") ? 1 : 0;
  return (base64.length / 4) * 3 - padding;
}

function loadImage(dataUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Could not read the screenshot for upload."));
    image.src = dataUrl;
  });
}

function renderAtScale(image: HTMLImageElement, scale: number): HTMLCanvasElement | null {
  const width = Math.max(1, Math.round(image.naturalWidth * scale));
  const height = Math.max(1, Math.round(image.naturalHeight * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) return null;
  context.drawImage(image, 0, 0, width, height);
  return canvas;
}

/**
 * Returns a data URL guaranteed to be under the route's size limit, or throws. It never returns an
 * oversized payload: a caller that "succeeds" here and then fails server-side with an opaque
 * validation error is exactly the kind of silent failure this flow already suffered from once.
 */
export async function encodeScreenshotForModel(dataUrl: string): Promise<string> {
  if (decodedBytes(dataUrl) <= MAX_SCREENSHOT_BYTES) return dataUrl;

  const image = await loadImage(dataUrl);
  const longestEdge = Math.max(image.naturalWidth, image.naturalHeight);
  let scale = Math.min(1, MAX_EDGE / longestEdge);

  for (let step = 0; step < MAX_SCALE_STEPS; step += 1) {
    const canvas = renderAtScale(image, scale);
    if (!canvas) break;

    for (const encode of ENCODERS) {
      const encoded = encode(canvas);
      if (decodedBytes(encoded) <= MAX_SCREENSHOT_BYTES) return encoded;
    }

    scale /= 2;
  }

  throw new Error("That screenshot is too large to analyse — try a smaller capture.");
}
