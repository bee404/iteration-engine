"use client";

import Image from "next/image";
import { useEffect, useState, type CSSProperties, type RefObject } from "react";

import { toCssColor, type VerticalColorSplit } from "@/lib/screenshot-edge-colors";
import { useScreenshotColorSplit } from "@/lib/use-screenshot-color-split";
import type { RoundImage } from "@/lib/stores/round-image";

/** The custom properties `.feedback-reference-frame.is-split` reads. */
type SplitVars = CSSProperties &
  Record<"--ref-split-leading" | "--ref-split-trailing" | "--ref-split-at", string>;

interface ReferenceImageProps {
  image: RoundImage;
  /** Attached to the <img> so the upload→feedback morph can measure the destination rect. */
  imgRef?: RefObject<HTMLImageElement | null>;
  /** Hides the underlying image while the morph clone flies in (feedback entrance only). */
  hidden?: boolean;
}

/**
 * The round's reference screenshot as Figma node 9:484 draws it: a layered "Background+Shadow"
 * frame cradling the image, a caption below, and a click-to-zoom lightbox at full viewport width
 * over a heavy backdrop blur. Shared by /feedback and every later step that shows the same screen,
 * so the container, caption, and lightbox behaviour stay identical as the image moves down the chain.
 */
export function ReferenceImage({ image, imgRef, hidden }: ReferenceImageProps) {
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const colorSplit = useScreenshotColorSplit(image.dataUrl);

  // While the lightbox is open, trap Escape and lock body scroll behind the blurred backdrop.
  useEffect(() => {
    if (!isLightboxOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsLightboxOpen(false);
    };
    window.addEventListener("keydown", onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [isLightboxOpen]);

  const dimensionLabel = image.dimensions
    ? `${image.dimensions.width} × ${image.dimensions.height} · viewport inferred`
    : "viewport inferred";

  return (
    <figure className="feedback-reference">
      {/* Layered "Background+Shadow" frame (Figma node 9:484). A future Pinpoint annotation layer
          mounts inside this frame above the image; the zoom trigger stays underneath it. */}
      <div
        className={`feedback-reference-frame ${colorSplit ? "is-split" : ""}`}
        style={splitVars(colorSplit)}
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- carried data URL, dimensions unknown at build */}
        <img
          ref={imgRef}
          className={`feedback-reference-img ${hidden ? "is-hidden" : ""}`}
          src={image.dataUrl}
          alt={`Reference screen ${image.fileName}`}
        />
        <button
          className="feedback-reference-open"
          type="button"
          onClick={() => setIsLightboxOpen(true)}
          aria-label={`View ${image.fileName} at full size`}
        >
          <span className="feedback-reference-zoom" aria-hidden="true">
            <Image src="/brand/icon-expand.svg" alt="" width={14} height={14} />
          </span>
        </button>
      </div>
      <figcaption className="feedback-caption">
        {image.fileName} · {dimensionLabel}
      </figcaption>

      {isLightboxOpen && (
        <div
          className="feedback-lightbox"
          role="dialog"
          aria-modal="true"
          aria-label={`${image.fileName} at full size`}
        >
          <div className="feedback-lightbox-scrim" onClick={() => setIsLightboxOpen(false)} />
          <button
            className="feedback-lightbox-close"
            type="button"
            onClick={() => setIsLightboxOpen(false)}
            aria-label="Close full view"
          >
            <span aria-hidden="true">×</span>
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element -- carried data URL, dimensions unknown at build */}
          <img
            className="feedback-lightbox-img"
            src={image.dataUrl}
            alt={`Reference screen ${image.fileName}`}
          />
        </div>
      )}
    </figure>
  );
}

function splitVars(split: VerticalColorSplit | null): SplitVars | undefined {
  if (!split) return undefined;
  return {
    "--ref-split-leading": toCssColor(split.leading),
    "--ref-split-trailing": toCssColor(split.trailing),
    "--ref-split-at": String(split.boundary),
  };
}

