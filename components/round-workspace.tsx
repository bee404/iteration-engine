"use client";

import { useCallback, useState } from "react";
import { useRoundStore } from "@/store/round-store";
import type { Critique, Direction } from "@/lib/types";
import { UploadForm } from "./upload-form";
import { CritiqueDisplay } from "./critique-display";
import { DirectionsComparison } from "./directions-comparison";

/**
 * Orchestrates the full round workflow against the store: intake -> critique ->
 * directions -> (optional per-direction code-gen) -> approval. Each step's API call
 * is made here; components below only read/write store state and render.
 */
export function RoundWorkspace() {
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

  const handleGenerateCritique = useCallback(async () => {
    startCritique();
    try {
      const response = await fetch("/api/critique", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ screenshotRef, designGoal, feedbackText, reviewerContext, constraints }),
      });
      if (!response.ok) throw new Error(`Critique request failed (${response.status})`);
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

  return (
    <div className="workspace">
      <UploadForm onSubmit={handleGenerateCritique} disabled={isCritiquing} />

      {critiqueError && <p className="error">Critique error: {critiqueError}</p>}

      {critique && (
        <CritiqueDisplay critique={critique} onContinue={handleGenerateDirections} isGeneratingDirections={isGeneratingDirections} />
      )}

      {directionsError && <p className="error">Directions error: {directionsError}</p>}

      {directions.length > 0 && (
        <DirectionsComparison directions={directions} designGoal={designGoal} onApprove={handleApprove} />
      )}

      {approvedMessage && (
        <section className="card approved-banner">
          <p>{approvedMessage}</p>
          <button type="button" onClick={() => { reset(); setApprovedMessage(null); }}>
            Start next round
          </button>
        </section>
      )}
    </div>
  );
}
