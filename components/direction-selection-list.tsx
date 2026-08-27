"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { PatternLinkIcon } from "@/components/coqui-marks";
import { StepHeader } from "@/components/step-header";
import { generatePrototype } from "@/lib/codegen-client";
import { requestDirections } from "@/lib/round-api";
import { useRoundStore } from "@/lib/stores/round";
import { useRoundViewport } from "@/lib/stores/round-viewport";
import type { Critique, Direction } from "@/lib/types";
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
 * The live critique this round's directions are grounded in, shown above them so the run is legible
 * as real per-round output rather than a fixed set of rows. Signal (real, actionable problems) and
 * preference (taste) stay visually separated — that split is the product's whole point, and
 * collapsing it here would flatten the one judgement the critique makes.
 */
function CritiqueSummary({ critique }: { critique: Critique }) {
  return (
    <section className="directions-critique" aria-label="Critique of your screen">
      <span className="directions-critique__kicker">What Claude saw</span>
      <p className="directions-critique__summary">{critique.summary}</p>

      <div className="directions-critique__columns">
        <div>
          <h2 className="directions-critique__label">Signal — worth acting on</h2>
          <ul className="directions-critique__list">
            {critique.signal.map((item, index) => (
              <li key={index}>{item.text}</li>
            ))}
          </ul>
        </div>
        <div>
          <h2 className="directions-critique__label">Preference — taste</h2>
          <ul className="directions-critique__list">
            {critique.preference.map((item, index) => (
              <li key={index}>{item.text}</li>
            ))}
          </ul>
        </div>
      </div>

      {critique.flaggedAmbiguities.length > 0 && (
        <div className="directions-critique__flagged">
          <h2 className="directions-critique__label">Too vague to act on yet</h2>
          <ul className="directions-critique__list">
            {critique.flaggedAmbiguities.map((item, index) => (
              <li key={index}>{item}</li>
            ))}
          </ul>
        </div>
      )}

      <p className="directions-critique__model">Model: {critique.model}</p>
    </section>
  );
}

/**
 * The fourth step (directions): three genuinely distinct approaches, each with its rationale,
 * tradeoffs, and a 21st.dev component it's grounded in, presented as a single-column row-list
 * (Figma node 127:1400) for the user to select one. Rows behave as a single-open accordion — the
 * first row is expanded on load, and clicking any other (collapsed) row swaps the expansion over
 * to it, so there is always exactly one row expanded, never zero and never more than one.
 * Rows are generated live from this round's critique, and arrive on the canonical
 * enter-from-bottom step transition straight from /feedback. `/synthesized` remains only as a
 * compatibility redirect.
 *
 * This screen used to render a static fixture. That is why a live run through the product returned
 * the same three approaches no matter what was uploaded, while hitting /api/directions directly
 * returned genuine output — the browser was never making the call at all.
 */
export function DirectionsScreen() {
  const router = useRouter();
  const stage = useStepStage();
  const lockBox = useRoundViewport((state) => state.lockBox);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const image = useRoundStore((state) => state.image);
  const brief = useRoundStore((state) => state.brief);
  const critique = useRoundStore((state) => state.critique);
  const directions = useRoundStore((state) => state.directions);
  const directionsSource = useRoundStore((state) => state.directionsSource);
  const selectedId = useRoundStore((state) => state.selectedDirectionId);
  const setDirections = useRoundStore((state) => state.setDirections);
  const selectDirection = useRoundStore((state) => state.selectDirection);

  const [error, setError] = useState<string | null>(null);
  // Bumped by "Try again", which is the only way a settled request is re-issued.
  const [retryCount, setRetryCount] = useState(0);

  // Directions belong to the critique that produced them; anything else is last round's output.
  const hasDirections = directions.length > 0 && directionsSource === critique;
  // Derived rather than stored: with a round in hand, "no directions and no error" is exactly the
  // condition under which the effect below has a request in flight. A separate status field would
  // be a second source of truth for the same fact, free to drift out of step with it.
  const isGenerating = Boolean(critique && brief) && !hasDirections && !error;
  // The accordion always has exactly one row open; before the user picks, that's the first row.
  const openId = expandedId ?? directions[0]?.id ?? null;

  useEffect(() => {
    if (!critique || !brief || hasDirections || error) return;

    let cancelled = false;

    (async () => {
      try {
        const generated = await requestDirections({
          critique,
          designGoal: brief.goal,
          feedbackText: brief.feedback,
          constraints: brief.constraints.trim() || undefined,
        });
        if (!cancelled) setDirections(critique, generated);
      } catch (directionsError) {
        if (cancelled) return;
        // Never fall back to canned directions on failure: showing plausible-looking rows for a
        // request that failed is indistinguishable from the bug this screen was fixed for.
        setError(directionsError instanceof Error ? directionsError.message : "Directions generation failed");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [critique, brief, hasDirections, error, setDirections, retryCount]);

  const handleRetry = useCallback(() => {
    setError(null);
    setRetryCount((count) => count + 1);
  }, []);

  const handleContinue = useCallback(() => {
    const direction = directions.find((candidate) => candidate.id === selectedId);
    if (!direction || !image || !brief) return;
    // The comparison box locks at the moment the request is grounded against it.
    lockBox();
    void generatePrototype({ direction, designGoal: brief.goal, screenshotRef: image.dataUrl });
    stage.exit(() => router.push("/prototype"));
  }, [selectedId, directions, image, brief, lockBox, stage, router]);

  const header = (
    <>
      <div className="feedback-atmosphere" aria-hidden="true" />
      <StepHeader />
    </>
  );

  // Direct load, or a reload that dropped the in-memory round: there is no brief to generate from,
  // so send the user back to the start rather than inventing directions for a round that does not
  // exist.
  if (!critique || !brief) {
    return (
      <main className="upload-page feedback-page">
        {header}
        <section className="feedback-empty">
          <h1>No round in progress</h1>
          <p>Directions are generated from your screenshot and brief. Start a round to see them.</p>
          <Link className="upload-proceed" href="/upload">
            Go to upload
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="upload-page feedback-page">
      {header}

      <div className={`directions-body ${stage.stageClass}`}>
        <header className="directions-header">
          <span className="directions-kicker">Step 04</span>
          <h1 className="directions-title">Choose a direction</h1>
          <p className="directions-lede">
            Three distinct takes on your brief — each names the decision it makes, the tradeoff it
            accepts, and a real pattern it&apos;s grounded in. Pick the one worth carrying forward.
          </p>
        </header>

        <CritiqueSummary critique={critique} />

        {isGenerating && (
          <p className="directions-status" role="status">
            Generating three directions from this critique…
          </p>
        )}

        {error && (
          <div className="directions-status directions-status--error" role="alert">
            <p>{error}</p>
            <button type="button" className="directions-restart" onClick={handleRetry}>
              Try again
            </button>
          </div>
        )}

        {hasDirections && (
          <section className="selection-list" aria-label="Iteration directions">
            <h2 className="selection-list__heading">Select a direction</h2>
            <div className="selection-list__rows">
              {directions.map((direction) => (
                <SelectionRow
                  key={direction.id}
                  direction={direction}
                  isSelected={selectedId === direction.id}
                  isExpanded={openId === direction.id}
                  onSelect={() => selectDirection(direction.id)}
                  onExpand={() => setExpandedId(direction.id)}
                />
              ))}
            </div>
          </section>
        )}

        <div className="directions-actions">
          <button
            type="button"
            className="feedback-synthesize"
            onClick={handleContinue}
            disabled={!selectedId}
          >
            Continue to prototype
          </button>
          <Link className="directions-restart" href="/upload">
            Start another exploration
          </Link>
        </div>
      </div>
    </main>
  );
}
