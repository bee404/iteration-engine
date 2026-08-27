import type { CSSProperties } from "react";

import type { ImageDimensions } from "@/lib/types";

/**
 * The two positions of the reference/iteration comparison control (Decision 10). This is a
 * binary display toggle and nothing more — there is deliberately no wipe scrubber, no
 * `Before / Split / After` third position, no draggable divider, and no side-by-side mode.
 */
export type ComparisonLayer = "source" | "iteration";

export const COMPARISON_LAYERS = [
  { id: "source", label: "Source" },
  { id: "iteration", label: "Iteration" },
] as const satisfies readonly { id: ComparisonLayer; label: string }[];

interface ComparisonViewportSources {
  /**
   * The chain's locked viewport box, once the per-chain viewport lock is available on the
   * client. Preferred over the raw screenshot size: the lock is the box every round in the
   * chain renders into, which is what makes registration exact across iterations.
   */
  lockedViewport: ImageDimensions | null;
  /** Natural pixel size of the round's reference screenshot; the interim box source. */
  screenshotDimensions: ImageDimensions | null;
}

/**
 * Picks the box both comparison layers render into, preferring the chain lock and falling back
 * to the screenshot's natural size. Returns null when neither is usable, which callers render as
 * an unconstrained box.
 */
export function resolveComparisonViewport({
  lockedViewport,
  screenshotDimensions,
}: ComparisonViewportSources): ImageDimensions | null {
  return firstUsableBox(lockedViewport) ?? firstUsableBox(screenshotDimensions);
}

function firstUsableBox(box: ImageDimensions | null): ImageDimensions | null {
  if (!box) return null;
  const isUsable =
    Number.isFinite(box.width) && Number.isFinite(box.height) && box.width > 0 && box.height > 0;
  return isUsable ? box : null;
}

/** Pixel size of the area the box has to fit inside. */
export interface StageSize {
  width: number;
  height: number;
}

/**
 * The largest box with `box`'s exact aspect ratio that fits inside `stage`, never scaled past the
 * round's natural size. Fitting has to be computed rather than expressed in CSS: `aspect-ratio`
 * only honours one definite dimension, so any pure-CSS attempt to constrain both width and height
 * silently drops the ratio — which is precisely the registration guarantee this view sells.
 */
export function fitViewportBox(box: ImageDimensions, stage: StageSize): StageSize {
  const scale = Math.min(stage.width / box.width, stage.height / box.height, 1);
  return { width: Math.round(box.width * scale), height: Math.round(box.height * scale) };
}

/**
 * Sizes the single shared viewport box. Both layers are children of this one element, so they
 * land on identical pixels by construction — two children of one box, not two boxes that happen
 * to match.
 */
export function comparisonViewportStyle(
  box: ImageDimensions | null,
  stage: StageSize | null,
): CSSProperties {
  // No usable screenshot size, or the stage hasn't been measured yet: fill what's available. The
  // ratio is unknown in the first case and unknowable-yet in the second, and a box that fills
  // the stage still registers both layers exactly.
  if (!box || !stage) return { width: "100%", height: "100%" };
  const fitted = fitViewportBox(box, stage);
  return { width: `${fitted.width}px`, height: `${fitted.height}px` };
}

/**
 * Sizes the iteration layer at the round's *true* viewport pixels and scales that whole surface
 * down into the fitted box.
 *
 * Without this the preview iframe would lay out at the fitted width (e.g. 906px) rather than the
 * round's actual viewport (1440px), so the generated component would resolve a different
 * responsive breakpoint than the reference screenshot was captured at. The two layers would still
 * align geometrically while disagreeing about what the design *is* — registration in name only.
 */
export function iterationScaleStyle(
  box: ImageDimensions | null,
  stage: StageSize | null,
): CSSProperties {
  if (!box || !stage) return { width: "100%", height: "100%" };
  const fitted = fitViewportBox(box, stage);
  return {
    width: `${box.width}px`,
    height: `${box.height}px`,
    transform: `scale(${fitted.width / box.width})`,
    transformOrigin: "top left",
  };
}

/** Design-QA caption for the box, e.g. `1440 × 900`. */
export function formatComparisonViewport(box: ImageDimensions | null): string {
  return box ? `${box.width} × ${box.height}` : "size unknown";
}
