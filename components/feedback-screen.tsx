"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useLayoutEffect, useRef, useState } from "react";

import { ReferenceImage } from "@/components/reference-image";
import { StepHeader } from "@/components/step-header";
import { LockedViewportNotice } from "@/components/viewport-box-field";
import { useRoundImage } from "@/lib/stores/round-image";
import { useStepStage } from "@/lib/use-step-stage";

type SynthesizeStatus = "idle" | "synthesizing" | "done";

const MORPH_MS = 520;

/**
 * The second Coquí screen (Figma frame 02): the uploaded reference on the left, a floating brief
 * panel on the right. It reads the round image staged by /upload and, when arriving through the
 * upload flow, morphs that screenshot from its previous position into the reference container while
 * the brief panel slides in from the right. Reduced-motion and direct-load both fall back cleanly.
 */
export function FeedbackScreen() {
  const router = useRouter();
  const image = useRoundImage((state) => state.image);
  const clearTransition = useRoundImage((state) => state.clearTransition);
  const setBrief = useRoundImage((state) => state.setBrief);
  const stage = useStepStage();
  // Snapshot the origin rect once: the store's copy is cleared as soon as the entrance plays.
  const [origin] = useState(() => useRoundImage.getState().transitionOrigin);

  const hasEntrance = Boolean(image && origin);
  const [phase, setPhase] = useState<"pre" | "run" | "done">(hasEntrance ? "pre" : "done");
  const referenceImgRef = useRef<HTMLImageElement>(null);

  const [goal, setGoal] = useState("");
  const [feedback, setFeedback] = useState("");
  const [reviewerContext, setReviewerContext] = useState("");
  const [constraints, setConstraints] = useState("");
  const [isExpanded, setIsExpanded] = useState(false);
  const [status, setStatus] = useState<SynthesizeStatus>("idle");

  useLayoutEffect(() => {
    if (!image || !origin || !referenceImgRef.current) {
      if (origin) clearTransition();
      return;
    }

    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const dest = referenceImgRef.current.getBoundingClientRect();
    if (prefersReduced || dest.width === 0 || origin.width === 0) {
      setPhase("done");
      clearTransition();
      return;
    }

    // A fixed clone flies from the upload preview's old position into the reference container while
    // the real image stays hidden underneath it. Appending to <body> keeps it clear of clipping.
    const clone = document.createElement("img");
    clone.src = image.dataUrl;
    clone.alt = "";
    clone.className = "feedback-morph-clone";
    Object.assign(clone.style, {
      top: `${origin.top}px`,
      left: `${origin.left}px`,
      width: `${origin.width}px`,
      height: `${origin.height}px`,
    });
    document.body.appendChild(clone);

    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      clone.remove();
      setPhase("done");
      clearTransition();
    };

    const raf = requestAnimationFrame(() => {
      setPhase("run"); // slides the brief panel in from the right
      clone.style.transition = `top ${MORPH_MS}ms cubic-bezier(0.22, 1, 0.36, 1), left ${MORPH_MS}ms cubic-bezier(0.22, 1, 0.36, 1), width ${MORPH_MS}ms cubic-bezier(0.22, 1, 0.36, 1), height ${MORPH_MS}ms cubic-bezier(0.22, 1, 0.36, 1)`;
      clone.style.top = `${dest.top}px`;
      clone.style.left = `${dest.left}px`;
      clone.style.width = `${dest.width}px`;
      clone.style.height = `${dest.height}px`;
    });

    clone.addEventListener("transitionend", finish);
    const safety = window.setTimeout(finish, MORPH_MS + 240);

    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(safety);
      clone.remove();
    };
    // Runs once on mount: the entrance is a one-shot keyed to the arriving navigation.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSynthesize = useCallback(() => {
    if (status !== "idle" || !goal.trim() || !feedback.trim()) return;
    setStatus("synthesizing");
    // No backend yet: treat the click as a successful synthesis — persist the brief (the data prep
    // the three /directions cards read from), then run the canonical exit-up transition straight to
    // /directions. The /synthesized recap is skipped entirely: it was an unnecessary confirmation
    // stop between writing the brief and seeing the directions, not a required step in the chain.
    window.setTimeout(() => {
      setBrief({ goal, feedback, reviewerContext, constraints });
      stage.exit(() => router.push("/directions"));
    }, 700);
  }, [goal, feedback, reviewerContext, constraints, status, setBrief, stage, router]);

  const canSynthesize = goal.trim().length > 0 && feedback.trim().length > 0 && status === "idle";

  const header = <StepHeader />;

  if (!image) {
    return (
      <main className="upload-page feedback-page">
        <div className="upload-page-atmosphere" aria-hidden="true" />
        {header}
        <section className="feedback-empty">
          <h1>No screen to improve yet</h1>
          <p>Pick a screenshot first, then write the brief here.</p>
          <Link className="upload-proceed" href="/upload">
            Go to upload
          </Link>
          {/* The reference image is in-memory only and does not survive a reload, but the chain's
              locked box does — it is read back from the persisted round, so it still reads out
              here rather than looking as though the lock were lost with the screenshot. */}
          <LockedViewportNotice />
        </section>
      </main>
    );
  }

  return (
    <main className="upload-page feedback-page">
      <div className="feedback-atmosphere" aria-hidden="true" />
      {header}

      <div className={`feedback-body ${stage.stageClass}`}>
        <section className="feedback-stage">
          <ReferenceImage image={image} imgRef={referenceImgRef} hidden={phase !== "done"} />
        </section>

        <aside className={`feedback-panel-wrap ${hasEntrance && phase !== "done" ? "is-offstage" : ""}`}>
          <h1 className="feedback-title">What should we fix?</h1>

          <div className="feedback-panel">
            <div className="feedback-field">
              <div className="feedback-field-head">
                <label htmlFor="goal">Goal</label>
                <span className="feedback-required">Required</span>
              </div>
              <textarea
                id="goal"
                className="feedback-textarea"
                rows={2}
                placeholder="What outcome should this change move us toward?"
                value={goal}
                onChange={(event) => setGoal(event.target.value)}
              />
            </div>

            <div className="feedback-field">
              <div className="feedback-field-head">
                <label htmlFor="feedback">Feedback, as received</label>
                <span className="feedback-required">Required</span>
              </div>
              <div className="feedback-textarea-wrap">
                <textarea
                  id="feedback"
                  className="feedback-textarea has-expand"
                  rows={4}
                  placeholder="Paste the raw note, comment, or transcript exactly as it came in."
                  value={feedback}
                  onChange={(event) => setFeedback(event.target.value)}
                />
                <button
                  className="feedback-expand"
                  type="button"
                  onClick={() => setIsExpanded(true)}
                  aria-label="Expand feedback into a larger editor"
                >
                  <Image src="/brand/icon-expand.svg" alt="" width={12} height={12} />
                </button>
              </div>
              <div className="feedback-count">{feedback.length} characters</div>
            </div>

            <div className="feedback-field">
              <div className="feedback-field-head">
                <label htmlFor="reviewer-context">Reviewer context</label>
              </div>
              <input
                id="reviewer-context"
                className="feedback-input"
                type="text"
                placeholder="Who is this for, and what do they care about?"
                value={reviewerContext}
                onChange={(event) => setReviewerContext(event.target.value)}
              />
            </div>

            <div className="feedback-field">
              <div className="feedback-field-head">
                <label htmlFor="constraints">Constraints</label>
              </div>
              <input
                id="constraints"
                className="feedback-input"
                type="text"
                placeholder="Anything that must not change?"
                value={constraints}
                onChange={(event) => setConstraints(event.target.value)}
              />
            </div>

            <div className="feedback-commit">
              <button
                className="feedback-synthesize"
                type="button"
                onClick={handleSynthesize}
                disabled={!canSynthesize}
                data-status={status}
              >
                {status === "synthesizing" && <span className="feedback-spinner" aria-hidden="true" />}
                {status === "synthesizing" ? "Synthesizing…" : status === "done" ? "Synthesized" : "Synthesize"}
              </button>
            </div>
          </div>
        </aside>
      </div>

      {isExpanded && (
        <div className="feedback-modal" role="dialog" aria-modal="true" aria-label="Feedback editor">
          <div className="feedback-modal-scrim" onClick={() => setIsExpanded(false)} />
          <div className="feedback-modal-card">
            <div className="feedback-modal-head">
              <h2>Feedback, as received</h2>
              <span className="feedback-count">{feedback.length} characters</span>
            </div>
            <textarea
              className="feedback-modal-textarea"
              autoFocus
              placeholder="Paste the raw note, comment, or transcript exactly as it came in."
              value={feedback}
              onChange={(event) => setFeedback(event.target.value)}
            />
            <div className="feedback-modal-actions">
              <button className="feedback-synthesize" type="button" onClick={() => setIsExpanded(false)}>
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

