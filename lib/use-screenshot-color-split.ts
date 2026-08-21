"use client";

import { useEffect, useState } from "react";

import {
  analyzeScreenshotColorSplit,
  type VerticalColorSplit,
} from "@/lib/screenshot-edge-colors";

/** A finished analysis, tagged with the screenshot it describes. */
interface Analysis {
  source: string;
  split: VerticalColorSplit | null;
}

/**
 * Analyses a screenshot's colour zones in the browser. Null until the analysis resolves, and
 * whenever the image has no clean split — callers treat both as "use the neutral container".
 */
export function useScreenshotColorSplit(dataUrl: string): VerticalColorSplit | null {
  const [analysis, setAnalysis] = useState<Analysis | null>(null);

  useEffect(() => {
    let active = true;
    void analyzeScreenshotColorSplit(dataUrl).then((split) => {
      if (active) setAnalysis({ source: dataUrl, split });
    });
    return () => {
      active = false;
    };
  }, [dataUrl]);

  // Derived rather than reset in the effect: a verdict for the previous screenshot must never paint
  // the current one, and tagging the result makes that staleness visible instead of a race.
  return analysis?.source === dataUrl ? analysis.split : null;
}
