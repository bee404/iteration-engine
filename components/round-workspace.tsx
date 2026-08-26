"use client";

import { useCallback, useState } from "react";
import { useRoundStore } from "@/store/round-store";
import { lockedBoxOf, useChainViewport } from "@/lib/stores/chain-viewport";
import type { Critique, Direction } from "@/lib/types";
import { persistApprovedRound } from "@/lib/persist-round";
import { requestCritique, requestDirections } from "@/lib/round-api";
import { buildExportBundle, downloadExportBundle } from "@/lib/export-bundle";
import { UploadForm } from "./upload-form";
import { CritiqueDisplay } from "./critique-display";
import { DirectionsComparison } from "./directions-comparison";
import { RoundHistory } from "./round-history";

/**
 * Orchestrates the full round workflow against the store: intake -> critique ->
 * directions -> (optional per-direction code-gen) -> approval. Each step's API call
 * is made here; components below only read/write store state and render.
 */
export function RoundWorkspace() {
  const [approvedMessage, setApprovedMessage] = useState<string | null>(null);
  const [isPersisting, setIsPersisting] = useState(false);
  const [historyRefreshKey, setHistoryRefreshKey] = useState(0);
  const [lastSavedRoundId, setLastSavedRoundId] = useState<string | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);

  const screenshotRef = useRoundStore((s) => s.screenshotRef);
  const screenshotDimensions = useRoundStore((s) => s.screenshotDimensions);
  const lockedViewport = useChainViewport((s) => lockedBoxOf(s.viewport));
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
  const generatedCodeByDirection = useRoundStore((s) => s.generatedCodeByDirection);

  const setApprovalStatus = useRoundStore((s) => s.setApprovalStatus);
  const reset = useRoundStore((s) => s.reset);

  const handleGenerateCritique = useCallback(async () => {
    startCritique();
    try {
      setCritique(
        await requestCritique({
          screenshotRef: screenshotRef ?? "",
          designGoal,
          feedbackText,
          reviewerContext,
          constraints,
        }),
      );
    } catch (error) {
      setCritiqueError(error instanceof Error ? error.message : "Critique failed");
    }
  }, [screenshotRef, designGoal, feedbackText, reviewerContext, constraints, startCritique, setCritique, setCritiqueError]);

  const handleGenerateDirections = useCallback(async () => {
    if (!critique) return;
    startDirections();
    try {
      setDirections(await requestDirections({ critique, designGoal, feedbackText, constraints }));
    } catch (error) {
      setDirectionsError(error instanceof Error ? error.message : "Directions generation failed");
    }
  }, [critique, designGoal, feedbackText, constraints, startDirections, setDirections, setDirectionsError]);

  const handleApprove = useCallback(async () => {
    setApprovalStatus("approved");
    setIsPersisting(true);

    const directionTitle = directions.find((d) => d.id === selectedDirectionId)?.title ?? selectedDirectionId;
    const result = await persistApprovedRound({
      screenshotRef,
      screenshotDimensions,
      lockedViewport,
      designGoal,
      feedbackText,
      reviewerContext,
      constraints,
      critique,
      directions,
      selectedDirectionId,
      generatedCodeByDirection,
      approvalStatus: "approved",
    });

    setIsPersisting(false);

    if (result.status === "persisted") {
      setApprovedMessage(
        `Round approved with direction "${directionTitle}" and saved to Turso (round ${result.round.id.slice(0, 8)}).`,
      );
      setLastSavedRoundId(result.round.id);
      setHistoryRefreshKey((key) => key + 1);
    } else if (result.status === "demo_mode") {
      setApprovedMessage(
        `Round approved with direction "${directionTitle}". Persistence is disabled while demo mode is on — nothing was written to Turso.`,
      );
    } else {
      setApprovedMessage(
        `Round approved with direction "${directionTitle}", but saving to Turso failed: ${result.message}`,
      );
    }
  }, [
    screenshotRef,
    screenshotDimensions,
    lockedViewport,
    designGoal,
    feedbackText,
    reviewerContext,
    constraints,
    critique,
    directions,
    selectedDirectionId,
    generatedCodeByDirection,
    setApprovalStatus,
  ]);

  const selectedGeneratedCode = selectedDirectionId ? generatedCodeByDirection[selectedDirectionId] : undefined;
  const canExport = Boolean(selectedDirectionId && selectedGeneratedCode?.status === "complete");

  const handleExport = useCallback(() => {
    if (!selectedDirectionId || !selectedGeneratedCode || selectedGeneratedCode.status !== "complete" || !critique) return;
    const direction = directions.find((d) => d.id === selectedDirectionId);
    if (!direction) return;

    setExportError(null);
    try {
      const bundle = buildExportBundle({
        direction,
        critique,
        code: selectedGeneratedCode.code,
        inputs: {
          designGoal,
          feedbackText,
          reviewerContext: reviewerContext ?? undefined,
          constraints: constraints ?? undefined,
        },
        viewport: lockedViewport ?? screenshotDimensions,
        warnings: selectedGeneratedCode.warnings,
      });
      downloadExportBundle(bundle);
    } catch (error) {
      setExportError(error instanceof Error ? error.message : "Export failed");
    }
  }, [selectedDirectionId, selectedGeneratedCode, critique, directions, designGoal, feedbackText, reviewerContext, constraints, lockedViewport, screenshotDimensions]);

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
          isApproving={isPersisting}
          onExport={handleExport}
          canExport={canExport}
        />
      )}

      {exportError && <p className="error">Export error: {exportError}</p>}

      {approvedMessage && (
        <section className="panel approved-banner">
          <p className="panel-lead">{approvedMessage}</p>
          <button type="button" className="btn-secondary" onClick={() => { reset(); setApprovedMessage(null); }}>
            Start next round
          </button>
        </section>
      )}

      <RoundHistory refreshKey={historyRefreshKey} />
    </div>
  );
}
