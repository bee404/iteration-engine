"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRoundStore } from "@/store/round-store";
import { readImageDimensions } from "@/lib/image-dimensions";
import { AddImageIcon, ExpandIcon } from "./coqui-marks";

interface UploadFormProps {
  onSubmit: () => void;
  disabled: boolean;
}

/**
 * Round intake — the two hero frames. A centered stage sits beside a fixed 320px brief panel,
 * and the whole surface transitions on one piece of state:
 *  - no screenshot  → Frame 1 "01 - add image": a dashed dropzone on the stage, an upload invite
 *    (the one gold-text CTA) with a ⌘V paste hint in the panel.
 *  - has screenshot → Frame 2 "02 - set brief": the uploaded image on the stage with a filename +
 *    inferred-viewport caption, and the brief form (Goal, Feedback, Reviewer context, Constraints,
 *    Synthesize) in the panel.
 */
export function UploadForm({ onSubmit, disabled }: UploadFormProps) {
  const screenshotRef = useRoundStore((s) => s.screenshotRef);
  const dimensions = useRoundStore((s) => s.screenshotDimensions);
  const designGoal = useRoundStore((s) => s.designGoal);
  const feedbackText = useRoundStore((s) => s.feedbackText);
  const reviewerContext = useRoundStore((s) => s.reviewerContext);
  const constraints = useRoundStore((s) => s.constraints);
  const setScreenshotRef = useRoundStore((s) => s.setScreenshotRef);
  const setScreenshotDimensions = useRoundStore((s) => s.setScreenshotDimensions);
  const setDesignGoal = useRoundStore((s) => s.setDesignGoal);
  const setFeedbackText = useRoundStore((s) => s.setFeedbackText);
  const setReviewerContext = useRoundStore((s) => s.setReviewerContext);
  const setConstraints = useRoundStore((s) => s.setConstraints);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [feedbackExpanded, setFeedbackExpanded] = useState(false);

  // Read image bytes into a base64 data URL so screenshotRef stays a plain string usable
  // server-side by the vision critique call (a blob: object URL can't be dereferenced there),
  // and capture natural dimensions at the one point the bytes are in hand.
  const ingestFile = useCallback(
    (file: File | null | undefined) => {
      if (!file) {
        setScreenshotRef(null);
        setScreenshotDimensions(null);
        setFileName(null);
        return;
      }
      setFileName(file.name);
      const reader = new FileReader();
      reader.onload = async () => {
        if (typeof reader.result !== "string") return;
        setScreenshotRef(reader.result);
        setScreenshotDimensions(await readImageDimensions(reader.result));
      };
      reader.readAsDataURL(file);
    },
    [setScreenshotRef, setScreenshotDimensions],
  );

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    ingestFile(event.target.files?.[0]);
  }

  const handleDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      setIsDragging(false);
      if (disabled) return;
      ingestFile(event.dataTransfer.files?.[0]);
    },
    [disabled, ingestFile],
  );

  // ⌘V paste: only while the stage is empty, so it never fights a text field mid-brief.
  useEffect(() => {
    if (screenshotRef || disabled) return;
    function handlePaste(event: ClipboardEvent) {
      const file = Array.from(event.clipboardData?.items ?? [])
        .find((item) => item.type.startsWith("image/"))
        ?.getAsFile();
      if (file) ingestFile(file);
    }
    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, [screenshotRef, disabled, ingestFile]);

  const canSubmit = !!screenshotRef && designGoal.trim().length > 0 && feedbackText.trim().length > 0;

  return (
    <section className={`round-intake ${screenshotRef ? "" : "is-empty"}`}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        disabled={disabled}
        hidden
      />

      {screenshotRef ? (
        <>
          {/* Frame 2 — Stage: the uploaded screenshot in a bezel with a caption riding outside. */}
          <div className="stage">
            <div className="stage-card">
              {/* eslint-disable-next-line @next/next/no-img-element -- local data URL, not an optimizable remote asset */}
              <img src={screenshotRef} alt="Uploaded screenshot" />
            </div>
            <p className="stage-caption">
              {fileName ?? "screenshot"}
              {" · "}
              <span className="measure">
                {dimensions ? `${dimensions.width} × ${dimensions.height}` : "—"}
              </span>{" · viewport inferred"}
            </p>
          </div>

          {/* Frame 2 — Brief panel */}
          <form
            className="brief-panel"
            onSubmit={(event) => {
              event.preventDefault();
              if (canSubmit) onSubmit();
            }}
          >
            <h2 className="panel-heading">What should we do fix?</h2>

            <label className="field">
              <span className="field-label-row">
                <span className="field-label">Goal</span>
                <span className="field-required">Required</span>
              </span>
              <textarea
                value={designGoal}
                onChange={(e) => setDesignGoal(e.target.value)}
                placeholder="Help a brand-new workspace admin complete setup without support."
                rows={2}
                disabled={disabled}
                required
              />
            </label>

            <label className="field">
              <span className="field-label-row">
                <span className="field-label">Feedback, as received</span>
                <span className="field-required">Required</span>
              </span>
              <div className="field-with-expand">
                <textarea
                  value={feedbackText}
                  onChange={(e) => setFeedbackText(e.target.value)}
                  placeholder="Paste the feedback as given, vague parts and all."
                  rows={feedbackExpanded ? 10 : 4}
                  disabled={disabled}
                  required
                />
                <button
                  type="button"
                  className="expand-button"
                  onClick={() => setFeedbackExpanded((v) => !v)}
                  aria-pressed={feedbackExpanded}
                  aria-label={feedbackExpanded ? "Collapse editor" : "Expand editor"}
                  title={feedbackExpanded ? "Collapse" : "Expand"}
                >
                  <ExpandIcon />
                </button>
              </div>
              <span className="field-counter">{feedbackText.length} characters</span>
            </label>

            <label className="field">
              <span className="field-label-row">
                <span className="field-label">Reviewer context</span>
                <span className="field-required">Optional</span>
              </span>
              <input
                type="text"
                value={reviewerContext}
                onChange={(e) => setReviewerContext(e.target.value)}
                placeholder="Who gave this, and through what lens?"
                disabled={disabled}
              />
            </label>

            <label className="field">
              <span className="field-label-row">
                <span className="field-label">Constraints</span>
                <span className="field-required">Optional</span>
              </span>
              <input
                type="text"
                value={constraints}
                onChange={(e) => setConstraints(e.target.value)}
                placeholder="What must not change?"
                disabled={disabled}
              />
            </label>

            <div className="panel-commit">
              <button type="submit" className="btn-primary" disabled={disabled || !canSubmit}>
                {disabled && <span className="spinner" role="status" aria-hidden="true" />}
                {disabled ? "Synthesizing…" : "Synthesize"}
              </button>
            </div>
          </form>
        </>
      ) : (
        /* Frame 1 — the dashed upload card carries the heading, invitation, and keycap hint. */
        <div className="dropzone-stage">
          <h2 className="display add-image-heading">Add the screen you want to improve</h2>
          <button
            type="button"
            className={`add-image-glyph ${isDragging ? "is-dragging" : ""}`}
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            disabled={disabled}
            aria-label="Add the screen you want to improve"
          >
            <AddImageIcon />
            <span className="upload-cta">Select image to upload</span>
            <span className="upload-hint">
              also you can drop your image or <span className="keycap">⌘V</span> to paste
            </span>
          </button>
        </div>
      )}
    </section>
  );
}

