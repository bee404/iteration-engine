"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";

import { PatternLinkIcon } from "@/components/coqui-marks";
import { StepHeader } from "@/components/step-header";
import { PREVIEW_DIRECTIONS } from "@/lib/fixtures/preview-directions";
import type { Direction } from "@/lib/types";
import { useStepStage } from "@/lib/use-step-stage";

interface SelectionRowProps {
  direction: Direction;
  isSelected: boolean;
  onSelect: () => void;
}

/**
 * One direction rendered as a full-width bordered row inside the shared list container (Figma
 * node 127:1400) — the alternate to `ApproachCard`'s floating-tile layout. Collapsed rows show a
 * single-line truncated description; expand to the full description plus a Details/Tradeoffs
 * two-column layout is driven off a single :hover selector in globals.css (see
 * .selection-list__*), the same always-in-sync-with-the-pointer convention `ApproachCard` uses,
 * so this never touches that component's markup or styles. Data bindings are identical: title,
 * rationale, suggestedChanges, tradeoffs, and patternReference all come from the same `Direction`
 * shape, so the two layouts render the exact same three directions for direct comparison.
 */
function SelectionRow({ direction, isSelected, onSelect }: SelectionRowProps) {
  return (
    <article className={`selection-list__row ${isSelected ? "is-selected" : ""}`}>
      <div className="selection-list__row-head">
        <h3 className="selection-list__title">{direction.title}</h3>
        <button
          type="button"
          onClick={onSelect}
          aria-pressed={isSelected}
          className="selection-list__select"
        >
          {isSelected ? "Selected" : "Select"}
        </button>
      </div>

      <p className="selection-list__description">{direction.rationale}</p>

      <div className="selection-list__details-grid">
        <div>
          <p className="selection-list__details-label">Details</p>
          <ul className="selection-list__details-list">
            {direction.suggestedChanges.map((change, i) => (
              <li key={i}>{change}</li>
            ))}
          </ul>
        </div>
        <span className="selection-list__divider" aria-hidden="true" />
        <div>
          <p className="selection-list__tradeoffs-label">Tradeoffs</p>
          <p className="selection-list__tradeoffs-text">{direction.tradeoffs}</p>
        </div>
      </div>

      {direction.patternReference && (
        <div className="selection-list__footer">
          <a
            href={direction.patternReference.url}
            target="_blank"
            rel="noreferrer"
            className="selection-list__source"
          >
            <PatternLinkIcon />
            Inspiration source
          </a>
        </div>
      )}
    </article>
  );
}

/**
 * Standalone comparison route for the alternate step-04 layout (Figma node 127:1400): the same
 * three `PREVIEW_DIRECTIONS`, laid out as one bordered row-list instead of `DirectionsScreen`'s
 * three-tile grid. Reachable at /directions-alt so it can be reviewed side-by-side with the live
 * /directions cards — it does not replace, import, or modify that route or `ApproachCard` in any
 * way. Reuses the same page chrome and step transition so only the direction layout differs.
 */
export function DirectionsAltScreen() {
  const router = useRouter();
  const stage = useStepStage();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const handleContinue = useCallback(() => {
    if (!selectedId) return;
    // No downstream route exists yet; continuing closes the round and loops to a fresh one,
    // playing the same slide-up-and-out exit so the chain stays continuous.
    stage.exit(() => router.push("/upload"));
  }, [selectedId, stage, router]);

  return (
    <main className="upload-page feedback-page">
      <div className="upload-dot-grid" aria-hidden="true" />
      <div className="feedback-atmosphere" aria-hidden="true" />
      <StepHeader />

      <div className={`directions-body ${stage.stageClass}`}>
        <header className="directions-header">
          <span className="directions-kicker">Step 04 · Alternate layout</span>
          <h1 className="directions-title">Choose a direction</h1>
          <p className="directions-lede">
            The same three approaches as /directions, laid out as a single row-list (Figma node
            127:1400) instead of separate cards — for side-by-side comparison.
          </p>
        </header>

        <section className="selection-list" aria-label="Iteration directions">
          <h2 className="selection-list__heading">Select a direction</h2>
          <div className="selection-list__rows">
            {PREVIEW_DIRECTIONS.map((direction) => (
              <SelectionRow
                key={direction.id}
                direction={direction}
                isSelected={selectedId === direction.id}
                onSelect={() => setSelectedId(direction.id)}
              />
            ))}
          </div>
        </section>

        <div className="directions-actions">
          <button
            type="button"
            className="feedback-synthesize"
            onClick={handleContinue}
            disabled={!selectedId}
          >
            Continue with this direction
          </button>
          <p className="directions-actions-note">
            Code generation is the next handoff. For now, continuing closes this round and starts a
            fresh one.
          </p>
          <Link className="directions-restart" href="/upload">
            Start another round
          </Link>
        </div>
      </div>
    </main>
  );
}

