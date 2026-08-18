"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";

import { StepHeader } from "@/components/step-header";
import { PREVIEW_DIRECTIONS } from "@/lib/fixtures/preview-directions";
import type { Direction } from "@/lib/types";
import { useStepStage } from "@/lib/use-step-stage";

interface ApproachCardProps {
  direction: Direction;
  isSelected: boolean;
  onSelect: () => void;
}

/**
 * One approach in the selection view. Reuses the established direction-card pattern
 * (explanation + tradeoffs + "Grounded in" 21st.dev link) but selection-only — the optional
 * code-generation action from the live workflow is out of scope for this canned design-QA pass.
 */
function ApproachCard({ direction, isSelected, onSelect }: ApproachCardProps) {
  return (
    <article className={`direction-card ${isSelected ? "selected" : ""}`}>
      <header>
        <h3>{direction.title}</h3>
        <button
          type="button"
          onClick={onSelect}
          aria-pressed={isSelected}
          className={isSelected ? "selected-badge" : "select-button"}
        >
          {isSelected ? "Selected" : "Select"}
        </button>
      </header>

      <p className="rationale">{direction.rationale}</p>

      <div className="tradeoffs">
        <strong>Tradeoffs:</strong> {direction.tradeoffs}
      </div>

      <ul className="change-list">
        {direction.suggestedChanges.map((change, i) => (
          <li key={i}>{change}</li>
        ))}
      </ul>

      {direction.patternReference && (
        <a
          href={direction.patternReference.url}
          target="_blank"
          rel="noreferrer"
          className="pattern-reference"
        >
          Grounded in: {direction.patternReference.name} ({direction.patternReference.source})
        </a>
      )}
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
          {PREVIEW_DIRECTIONS.map((direction) => (
            <ApproachCard
              key={direction.id}
              direction={direction}
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