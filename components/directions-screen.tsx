"use client";

import Link from "next/link";

import { StepHeader } from "@/components/step-header";
import { useStepStage } from "@/lib/use-step-stage";

/**
 * Stub for the fourth step (directions). A follow-up task builds the real approach-selection
 * content; for now this is a finished-looking placeholder that still arrives on the canonical
 * enter-from-bottom step transition, so the chain feels continuous.
 */
export function DirectionsScreen() {
  const stage = useStepStage();

  return (
    <main className="upload-page feedback-page">
      <div className="upload-dot-grid" aria-hidden="true" />
      <div className="feedback-atmosphere" aria-hidden="true" />
      <StepHeader />

      <section className={`directions-stub ${stage.stageClass}`}>
        <span className="directions-kicker">Step 04</span>
        <h1 className="directions-title">Directions</h1>
        <p className="directions-lede">
          A few distinct directions for this change will live here — each a considered take on your
          brief, ready to compare side by side.
        </p>
        <span className="directions-badge">Coming soon</span>
        <Link className="directions-restart" href="/upload">
          Start another round
        </Link>
      </section>
    </main>
  );
}

