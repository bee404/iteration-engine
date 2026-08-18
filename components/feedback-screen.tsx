"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useLayoutEffect, useRef, useState } from "react";

import { useRoundImage } from "@/lib/stores/round-image";

type SynthesizeStatus = "idle" | "synthesizing" | "done";

const MORPH_MS = 520;

/**
 * The second Coquí screen (Figma frame 02): the uploaded reference on the left, a floating brief
 * panel on the right. It reads the round image staged by /upload and, when arriving through the
 * upload flow, morphs that screenshot from its previous position into the reference container while
 * the brief panel slides in from the right. Reduced-motion and direct-load both fall back cleanly.
 */
export function FeedbackScreen() {
  const image = useRoundImage((state) => state.image);
  const clearTransition = useRoundImage((state) => state.clearTransition);
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
    window.setTimeout(() => {
      setStatus("done");
      window.setTimeout(() => setStatus("idle"), 1600);
    }, 1500);
  }, [feedback, goal, status]);

  const canSynthesize = goal.trim().length > 0 && feedback.trim().length > 0 && status === "idle";

  const header = (
    <header className="upload-header">
      <Link className="upload-wordmark" href="/" aria-label="Coquí home">
        <Image src="/brand/coqui-wordmark.svg" alt="Coquí" width={56} height={26} priority />
      </Link>
      <div className="upload-header-actions">
        <a className="upload-help-link" href="mailto:bryan@bryanlew.is">
          Need help? <span className="upload-help-link-cta">Get in touch</span>
        </a>
        <button className="upload-sound-button" type="button" aria-label="Sound is muted" disabled>
          <Image src="/brand/icon-volume-cross.svg" alt="" width={20} height={20} />
        </button>
      </div>
    </header>
  );

  if (!image) {
    return (
      <main className="upload-page feedback-page">
        <div className="upload-dot-grid" aria-hidden="true" />
        <div className="upload-page-atmosphere" aria-hidden="true" />
        {header}
        <section className="feedback-empty">
          <h1>No screen to improve yet</h1>
          <p>Pick a screenshot first, then write the brief here.</p>
          <Link className="upload-proceed" href="/upload">
            Go to upload
          </Link>
        </section>
      </main>
    );
  }

  const dimensionLabel = image.dimensions
    ? `${image.dimensions.width} × ${image.dimensions.height} · viewport inferred`
    : "viewport inferred";

  return (
    <main className="upload-page feedback-page">
      <div className="upload-dot-grid" aria-hidden="true" />
      <div className="feedback-atmosphere" aria-hidden="true" />
      {header}

      <div className="feedback-body">
        <section className="feedback-stage">
          <figure className="feedback-reference">
            {/* eslint-disable-next-line @next/next/no-img-element -- carried data URL, dimensions unknown at build */}
            <img
              ref={referenceImgRef}
              className={`feedback-reference-img ${phase !== "done" ? "is-hidden" : ""}`}
              src={image.dataUrl}
              alt={`Reference screen ${image.fileName}`}
            />
            <figcaption className="feedback-caption">
              {image.fileName} · {dimensionLabel}
            </figcaption>
          </figure>
        </section>

        <aside className={`feedback-panel ${hasEntrance && phase !== "done" ? "is-offstage" : ""}`}>
          <h1 className="feedback-title">What should we fix?</h1>

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

