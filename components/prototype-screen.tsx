"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback } from "react";

import { ComparisonViewport } from "@/components/comparison-viewport";
import { StepHeader } from "@/components/step-header";
import { generatePrototype } from "@/lib/codegen-client";
import { buildExportBundle, downloadExportBundle } from "@/lib/export-bundle";
import { useRoundStore } from "@/lib/stores/round";
import { lockedBoxOf, useRoundViewport } from "@/lib/stores/round-viewport";
import { useStepStage } from "@/lib/use-step-stage";

/** Final V0 stage: review the generated direction and download its portable handoff. */
export function PrototypeScreen() {
  const router = useRouter();
  const stage = useStepStage();
  const image = useRoundStore((state) => state.image);
  const brief = useRoundStore((state) => state.brief);
  const critique = useRoundStore((state) => state.critique);
  const directions = useRoundStore((state) => state.directions);
  const selectedDirectionId = useRoundStore((state) => state.selectedDirectionId);
  const prototype = useRoundStore((state) => state.prototype);
  const resetRound = useRoundStore((state) => state.reset);
  const viewport = useRoundViewport((state) => lockedBoxOf(state.viewport));
  const resetViewport = useRoundViewport((state) => state.reset);
  const direction = directions.find((candidate) => candidate.id === selectedDirectionId) ?? null;

  const retry = useCallback(() => {
    if (!direction || !brief || !image) return;
    void generatePrototype({ direction, designGoal: brief.goal, screenshotRef: image.dataUrl });
  }, [direction, brief, image]);

  const download = useCallback(() => {
    if (!direction || !brief || !critique || prototype?.status !== "complete") return;
    downloadExportBundle(
      buildExportBundle({
        direction,
        critique,
        code: prototype.code,
        inputs: {
          designGoal: brief.goal,
          feedbackText: brief.feedback,
          reviewerContext: brief.reviewerContext.trim() || undefined,
          constraints: brief.constraints.trim() || undefined,
        },
        viewport: viewport ?? image?.dimensions ?? null,
        warnings: prototype.warnings,
      }),
    );
  }, [direction, brief, critique, prototype, viewport, image]);

  const startAnother = useCallback(() => {
    resetRound();
    resetViewport();
    stage.exit(() => router.push("/upload"));
  }, [resetRound, resetViewport, stage, router]);

  const header = (
    <>
      <div className="feedback-atmosphere" aria-hidden="true" />
      <StepHeader />
    </>
  );

  if (!image || !brief || !critique || !direction || !prototype) {
    return (
      <main className="upload-page feedback-page">
        {header}
        <section className="feedback-empty">
          <h1>No prototype in progress</h1>
          <p>Select a direction first, then Coquí can generate its prototype.</p>
          <Link className="upload-proceed" href="/upload">
            Start an exploration
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="upload-page feedback-page">
      {header}
      <div className={`prototype-body ${stage.stageClass}`}>
        <header className="prototype-header">
          <span className="directions-kicker">Step 05</span>
          <h1 className="directions-title">Review your prototype</h1>
          <p className="directions-lede">
            “{direction.title}” is rendered against the same viewport as your source. Download the
            runnable code together with the inputs and reasoning that produced it.
          </p>
        </header>

        {prototype.status === "streaming" ? (
          <div className="prototype-generating" role="status" aria-live="polite">
            <span className="spinner" aria-hidden="true" />
            <p>Generating the selected direction…</p>
          </div>
        ) : (
          <ComparisonViewport
            screenshotRef={image.dataUrl}
            viewport={viewport ?? image.dimensions}
            code={prototype.code}
            language={prototype.language}
            status={prototype.status}
            error={prototype.error}
          />
        )}

        {prototype.warnings && prototype.warnings.length > 0 && (
          <ul className="code-warnings" aria-label="Prototype generation notes">
            {prototype.warnings.map((warning) => (
              <li key={warning}>{warning}</li>
            ))}
          </ul>
        )}

        <div className="prototype-actions">
          {prototype.status === "error" ? (
            <button type="button" className="feedback-synthesize" onClick={retry}>
              Retry generation
            </button>
          ) : (
            <button
              type="button"
              className="feedback-synthesize"
              onClick={download}
              disabled={prototype.status !== "complete"}
            >
              Download prototype
            </button>
          )}
          <button type="button" className="directions-restart" onClick={startAnother}>
            Start another exploration
          </button>
          <p className="prototype-privacy-note">
            The download excludes your screenshot. Coquí keeps this exploration in this browser
            session only.
          </p>
        </div>
      </div>
    </main>
  );
}
