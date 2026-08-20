"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";

import { ChevronDownIcon, PatternLinkIcon } from "@/components/coqui-marks";
import { StepHeader } from "@/components/step-header";
import { PREVIEW_DIRECTIONS } from "@/lib/fixtures/preview-directions";
import type { Direction } from "@/lib/types";
import { useStepStage } from "@/lib/use-step-stage";

interface ApproachCardProps {
  direction: Direction;
  /** Zero-based position in the set, rendered as the gold "01" / "02" / "03" index mark. */
  index: number;
  isSelected: boolean;
  onSelect: () => void;
}

/**
 * One approach in the selection view (Figma node 130:1896). All three of its states —
 * default, hover-scaled, hover-expanded — are driven off a single :hover selector in
 * globals.css (see .approach-card__*) rather than extra component state, so expand/collapse
 * can never drift out of sync with the pointer. Data bindings are unchanged from the prior
 * card: title, rationale, suggestedChanges, tradeoffs, patternReference, and the select
 * interaction all come from the same `Direction` shape.
 */
function ApproachCard({ direction, index, isSelected, onSelect }: ApproachCardProps) {
  const orderLabel = String(index + 1).padStart(2, "0");

  return (
    <article className={`approach-card ${isSelected ? "is-selected" : ""}`}>
      <div className="approach-card__head">
        <h3 className="approach-card__title">{direction.title}</h3>
        <span className="approach-card__index" aria-hidden="true">
          {orderLabel}
        </span>
      </div>

      <p className="approach-card__description">{direction.rationale}</p>

      <div className="approach-card__details">
        <div className="approach-card__details-toggle">
          <span className="approach-card__details-label">Details</span>
          <ChevronDownIcon className="approach-card__chevron" />
        </div>
        <ul className="approach-card__details-list">
          {direction.suggestedChanges.map((change, i) => (
            <li key={i}>{change}</li>
          ))}
        </ul>
      </div>

      <div className="approach-card__tradeoffs">
        <span className="approach-card__tradeoffs-label">Tradeoffs</span>
        <p className="approach-card__tradeoffs-text">{direction.tradeoffs}</p>
      </div>

      <div className="approach-card__footer">
        {direction.patternReference && (
          <a
            href={direction.patternReference.url}
            target="_blank"
            rel="noreferrer"
            className="approach-card__source"
          >
            <PatternLinkIcon />
            {direction.patternReference.name}
          </a>
        )}

        <button
          type="button"
          onClick={onSelect}
          aria-pressed={isSelected}
          className="approach-card__select"
        >
          {isSelected ? "Selected" : "Select"}
        </button>
      </div>
    </article>
  );
}

/**
 * The fourth step (directions): three genuinely distinct approaches, each with its rationale,
 * tradeoffs, and a 21st.dev component it's grounded in, presented for the user to select one.
 * Populated with canned data for this design-QA pass (real AI generation is out of scope), and
 * arrives on the canonical enter-from-bottom step transition from /synthesized.
 */
export function DirectionsScreen() {
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
          <span className="directions-kicker">Step 04</span>
          <h1 className="directions-title">Choose a direction</h1>
          <p className="directions-lede">
            Three distinct takes on your brief — each names the decision it makes, the tradeoff it
            accepts, and a real pattern it&apos;s grounded in. Pick the one worth carrying forward.
          </p>
        </header>

        <section className="directions-grid" aria-label="Iteration directions">
          {PREVIEW_DIRECTIONS.map((direction, index) => (
            <ApproachCard
              key={direction.id}
              direction={direction}
              index={index}
              isSelected={selectedId === direction.id}
              onSelect={() => setSelectedId(direction.id)}
            />
          ))}
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