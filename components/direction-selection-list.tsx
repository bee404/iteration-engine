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
  isExpanded: boolean;
  onSelect: () => void;
  onExpand: () => void;
}

/**
 * One direction rendered as a full-width bordered row inside the shared list container (Figma
 * node 127:1400) — the primary step-04 layout, having replaced the earlier floating-tile
 * `ApproachCard` grid. Exactly one row is expanded at a time (single-open accordion): clicking a
 * row tells the parent to make it the expanded one via `onExpand`. Expansion is driven entirely
 * by that parent-owned state (`.is-expanded`), never by `:hover`, so pointing at a row can no
 * longer change which one is open. Data bindings are unchanged: title, rationale,
 * suggestedChanges, tradeoffs, and patternReference all come from the same `Direction` shape.
 */
function SelectionRow({ direction, isSelected, isExpanded, onSelect, onExpand }: SelectionRowProps) {
  return (
    <article
      className={`selection-list__row ${isSelected ? "is-selected" : ""} ${isExpanded ? "is-expanded" : ""}`}
      role="button"
      tabIndex={0}
      aria-expanded={isExpanded}
      onClick={onExpand}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onExpand();
        }
      }}
    >
      <div className="selection-list__row-head">
        <h3 className="selection-list__title">{direction.title}</h3>
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onSelect();
          }}
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
            onClick={(event) => event.stopPropagation()}
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
 * The fourth step (directions): three genuinely distinct approaches, each with its rationale,
 * tradeoffs, and a 21st.dev component it's grounded in, presented as a single-column row-list
 * (Figma node 127:1400) for the user to select one. Rows behave as a single-open accordion — the
 * first row is expanded on load, and clicking any other (collapsed) row swaps the expansion over
 * to it, so there is always exactly one row expanded, never zero and never more than one.
 * Populated with canned data for this design-QA pass (real AI generation is out of scope), and
 * arrives on the canonical enter-from-bottom step transition straight from /feedback — the
 * /synthesized recap is no longer a stop in this path (see synthesized-screen.tsx).
 */
export function DirectionsScreen() {
  const router = useRouter();
  const stage = useStepStage();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(PREVIEW_DIRECTIONS[0]?.id ?? null);

  const handleContinue = useCallback(() => {
    if (!selectedId) return;
    // No downstream route exists yet; continuing closes the round and loops to a fresh one,
    // playing the same slide-up-and-out exit so the chain stays continuous.
    stage.exit(() => router.push("/upload"));
  }, [selectedId, stage, router]);

  return (
    <main className="upload-page feedback-page">
      <div className="feedback-atmosphere" aria-hidden="true" />
      <StepHeader />

      <div className={`directions-body ${stage.stageClass}`}>
        <header className="directions-header">
          <span className="directions-kicker">Step 04</span>
          <h1 className="directions-title">Choose a direction</h1>
          <p className="directions-lede">
            Three distinct takes on your brief — each names the decision it makes, the tradeoff it
            accepts, and a real pattern it&apos;s grounded in. Pick the one worth carrying forward.
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
                isExpanded={expandedId === direction.id}
                onSelect={() => setSelectedId(direction.id)}
                onExpand={() => setExpandedId(direction.id)}
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
