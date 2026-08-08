"use client";

import { useCallback, useState } from "react";
import { useRoundStore } from "@/store/round-store";
import type { Critique, Direction } from "@/lib/types";
import { UploadForm } from "./upload-form";
import { CritiqueDisplay } from "./critique-display";
import { DirectionsComparison } from "./directions-comparison";

/**
 * The critique route always returns a typed `{ error, code }` JSON body on failure (see
 * app/api/critique/route.ts), even for errors it didn't anticipate. Surface that message
 * instead of just the bare status code — "Critique request failed (502)" tells a reviewer
 * nothing about whether that's an invalid screenshot, an Anthropic outage, or a real bug.
 */
async function describeCritiqueFailure(response: Response): Promise<string> {
  const body = await response.json().catch(() => null);
  if (body && typeof body.error === "string") {
    return typeof body.code === "string" ? `${body.error} (${body.code})` : body.error;
  }
  return `Critique request failed (${response.status})`;
}

/**
 * Orchestrates the full round workflow against the store: intake -> critique ->
 * directions -> (optional per-direction code-gen) -> approval. Each step's API call
 * is made here; components below only read/write store state and render.
 */
interface RoundWorkspaceProps {
  /** Computed server-side from DEMO_MODE (see lib/demo-mode.ts) and passed down as a prop —
   * client components can't read raw server env vars directly. */
  demoMode: boolean;
}

export function RoundWorkspace({ demoMode }: RoundWorkspaceProps) {
  const [approvedMessage, setApprovedMessage] = useState<string | null>(null);

  const screenshotRef = useRoundStore((s) => s.screenshotRef);
  const designGoal = useRoundStore((s) => s.designGoal);
  const feedbackText = useRoundStore((s) => s.feedbackText);
  const reviewerContext = useRoundStore((s) => s.reviewerContext);
  const constraints = useRoundStore((s) => s.constraints);

  const critique = useRoundStore((s) => s.critique);
  const isCritiquing = useRoundStore((s) => s.isCritiquing);
  const critiqueError = useRoundStore((s) => s.critiqueError);
  const startCritique = useRoundStore((s) => s.startCritique);
  const setCritique = useRoundStore((s) => s.setCritique);
  const setCritiqueError = useRoundStore((s) => s.setCritiqueError);

  const directions = useRoundStore((s) => s.directions);
  const isGeneratingDirections = useRoundStore((s) => s.isGeneratingDirections);
  const directionsError = useRoundStore((s) => s.directionsError);
  const startDirections = useRoundStore((s) => s.startDirections);
  const setDirections = useRoundStore((s) => s.setDirections);
  const setDirectionsError = useRoundStore((s) => s.setDirectionsError);
  const selectedDirectionId = useRoundStore((s) => s.selectedDirectionId);

  const setApprovalStatus = useRoundStore((s) => s.setApprovalStatus);
  const reset = useRoundStore((s) => s.reset);
  const advanceDemoRound = useRoundStore((s) => s.advanceDemoRound);

  const handleGenerateCritique = useCallback(async () => {
    startCritique();
    try {
      const response = await fetch("/api/critique", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ screenshotRef, designGoal, feedbackText, reviewerContext, constraints }),
      });
      if (!response.ok) throw new Error(await describeCritiqueFailure(response));
      const data: { critique: Critique } = await response.json();
      setCritique(data.critique);
    } catch (error) {
      setCritiqueError(error instanceof Error ? error.message : "Critique failed");
    }
  }, [screenshotRef, designGoal, feedbackText, reviewerContext, constraints, startCritique, setCritique, setCritiqueError]);

  const handleGenerateDirections = useCallback(async () => {
    if (!critique) return;
    startDirections();
    try {
      const response = await fetch("/api/directions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ critique, designGoal, feedbackText, constraints }),
      });
      if (!response.ok) throw new Error(`Directions request failed (${response.status})`);
      const data: { directions: Direction[] } = await response.json();
      setDirections(data.directions);
    } catch (error) {
      setDirectionsError(error instanceof Error ? error.message : "Directions generation failed");
    }
  }, [critique, designGoal, feedbackText, constraints, startDirections, setDirections, setDirectionsError]);

  const handleApprove = useCallback(() => {
    setApprovalStatus("approved");
    setApprovedMessage(
      `Round approved with direction "${directions.find((d) => d.id === selectedDirectionId)?.title ?? selectedDirectionId}". ` +
        "Persistence to Turso happens via POST /api/rounds once this workspace is wired to a real project.",
    );
  }, [setApprovalStatus, directions, selectedDirectionId]);

  // In demo mode there's no real "new round" to start — reset() would just dump the reviewer
  // back at a blank intake form requiring a fresh screenshot upload and re-typed inputs demo
  // mode never reads anyway. advanceDemoRound() instead walks forward to the next captured
  // fixture, pre-filled and ready to replay. Outside demo mode, reset() is still correct: a
  // live round genuinely needs fresh inputs.
  const handleNextRound = useCallback(() => {
    if (demoMode) {
      advanceDemoRound();
    } else {
      reset();
    }
    setApprovedMessage(null);
  }, [demoMode, advanceDemoRound, reset]);

  return (
    <div className="workspace">
      <UploadForm onSubmit={handleGenerateCritique} disabled={isCritiquing} />

      {critiqueError && <p className="error">Critique error: {critiqueError}</p>}

      {critique && (
        <CritiqueDisplay critique={critique} onContinue={handleGenerateDirections} isGeneratingDirections={isGeneratingDirections} />
      )}

      {directionsError && <p className="error">Directions error: {directionsError}</p>}

      {directions.length > 0 && (
        <DirectionsComparison
          directions={directions}
          designGoal={designGoal}
          screenshotRef={screenshotRef}
          onApprove={handleApprove}
        />
      )}

      {approvedMessage && (
        <section className="card approved-banner">
          <p>{approvedMessage}</p>
          <button type="button" onClick={handleNextRound}>
            {demoMode ? "Next round \u2192" : "Start next round"}
          </button>
        </section>
      )}
    </div>
  );
}
