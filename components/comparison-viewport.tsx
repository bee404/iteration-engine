"use client";

import { useState } from "react";

import {
  COMPARISON_LAYERS,
  comparisonViewportStyle,
  formatComparisonViewport,
  iterationScaleStyle,
  type ComparisonLayer,
} from "@/lib/comparison-viewport";
import type { GeneratedCodeStatus, ImageDimensions } from "@/lib/types";
import { useElementSize } from "@/lib/use-element-size";

import { PreviewFrame } from "./preview-frame";

interface ComparisonViewportProps {
  /** Data URL of the round's reference screenshot — what the `Source` position shows. */
  screenshotRef: string | null;
  /** The box both layers render into. Null when screenshot dimensions are unavailable. */
  viewport: ImageDimensions | null;
  code: string;
  language: string;
  status: GeneratedCodeStatus;
  error?: string;
}

/**
 * The reference/iteration comparison control (Decisions 10 and 14): a two-position toggle over
 * one fixed, unmoving viewport box. Perfect registration is structural here — `Source` and
 * `Iteration` are two absolutely-positioned children of the *same* box element, so neither can
 * drift from the other. `Iteration` always compares against the round's own reference screenshot,
 * and when generated code compiles but fails to mount, `PreviewFrame` swaps in the source plus
 * the runtime error inside that same box while `Source` keeps showing the reference untouched.
 *
 * Both layers stay mounted at all times. The toggle only changes which one is visible, so
 * flipping it never remounts the live preview, re-transpiles, or reloads the screenshot — it is
 * a display toggle, not a re-fetch. Hiding is done with `visibility`, which also drops the
 * inactive layer out of the tab order and the accessibility tree without unloading its iframe.
 */
export function ComparisonViewport({
  screenshotRef,
  viewport,
  code,
  language,
  status,
  error,
}: ComparisonViewportProps) {
  // The sheet opens on a direction the user just generated, so lead with the result.
  const [activeLayer, setActiveLayer] = useState<ComparisonLayer>("iteration");
  const [stageRef, stage] = useElementSize();

  return (
    <div className="comparison">
      <div className="comparison-toggle" role="group" aria-label="Compare reference and iteration">
        {COMPARISON_LAYERS.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            className={`comparison-toggle-option ${activeLayer === id ? "is-active" : ""}`}
            aria-pressed={activeLayer === id}
            onClick={() => setActiveLayer(id)}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="comparison-stage" ref={stageRef}>
        <div className="comparison-viewport" style={comparisonViewportStyle(viewport, stage)}>
          <div className={`comparison-layer ${activeLayer === "source" ? "" : "is-hidden"}`}>
            {screenshotRef ? (
              /* eslint-disable-next-line @next/next/no-img-element -- carried data URL, dimensions unknown at build */
              <img
                className="comparison-source-img"
                src={screenshotRef}
                alt="Reference screen this round iterates on"
              />
            ) : (
              <p className="comparison-empty">
                This round has no reference screenshot, so there is nothing to compare against.
              </p>
            )}
          </div>

          <div className={`comparison-layer ${activeLayer === "iteration" ? "" : "is-hidden"}`}>
            <div className="comparison-scaler" style={iterationScaleStyle(viewport, stage)}>
              <PreviewFrame code={code} language={language} status={status} error={error} />
            </div>
          </div>
        </div>
      </div>

      <p className="comparison-caption">
        Fixed viewport · {formatComparisonViewport(viewport)}
        {viewport ? "" : " — this round predates viewport capture, so the box fills the sheet"}
      </p>
    </div>
  );
}
