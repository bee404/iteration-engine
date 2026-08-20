"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback } from "react";

import { ReferenceImage } from "@/components/reference-image";
import { StepHeader } from "@/components/step-header";
import { useRoundImage } from "@/lib/stores/round-image";
import { useStepStage } from "@/lib/use-step-stage";

interface RecapRow {
  label: string;
  value: string;
}

/**
 * The third Coquí screen (Figma frame 03): the same reference screenshot on the left, and a
 * read-only recap of the brief the user just wrote on the right (Figma node 49:197). It echoes the
 * user's actual input — not canned copy — carried through the round store, and hands off to the
 * directions step via the canonical step transition.
 *
 * Not part of the active round path: /feedback now advances straight to /directions, skipping this
 * confirmation stop. The route and component are kept (unreachable via app navigation, but still
 * directly loadable) because they share layout/styling work with /feedback — remove once nothing
 * still depends on them.
 */
export function SynthesizedScreen() {
  const router = useRouter();
  const image = useRoundImage((state) => state.image);
  const brief = useRoundImage((state) => state.brief);
  const stage = useStepStage();

  const handleContinue = useCallback(() => {
    stage.exit(() => router.push("/directions"));
  }, [stage, router]);

  if (!image) {
    return (
      <main className="upload-page feedback-page">
        <div className="upload-page-atmosphere" aria-hidden="true" />
        <StepHeader />
        <section className="feedback-empty">
          <h1>Nothing to synthesize yet</h1>
          <p>Start from a screenshot and a brief, then synthesize to land here.</p>
          <Link className="upload-proceed" href="/upload">
            Go to upload
          </Link>
        </section>
      </main>
    );
  }

  const rows: RecapRow[] = [
    { label: "Goal", value: brief?.goal.trim() ?? "" },
    { label: "Feedback, as received", value: brief?.feedback.trim() ?? "" },
    { label: "Reviewer context", value: brief?.reviewerContext.trim() ?? "" },
    { label: "Constraints", value: brief?.constraints.trim() ?? "" },
  ];

  return (
    <main className="upload-page feedback-page">
      <div className="feedback-atmosphere" aria-hidden="true" />
      <StepHeader />

      <div className={`feedback-body ${stage.stageClass}`}>
        <section className="feedback-stage">
          <ReferenceImage image={image} />
        </section>

        <aside className="feedback-panel-wrap">
          <h1 className="feedback-title">What should we fix?</h1>

          <div className="feedback-panel recap-panel">
            <dl className="recap-list">
              {rows.map((row) => (
                <div className="recap-row" key={row.label}>
                  <dt className="recap-label">{row.label}</dt>
                  <dd className={`recap-value ${row.value ? "" : "is-empty"}`}>
                    {row.value || "Not provided"}
                  </dd>
                </div>
              ))}
            </dl>

            <div className="feedback-commit">
              <button className="feedback-synthesize" type="button" onClick={handleContinue}>
                View directions
              </button>
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}

