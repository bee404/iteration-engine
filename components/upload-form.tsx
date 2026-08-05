"use client";

import { useRoundStore } from "@/store/round-store";

interface UploadFormProps {
  onSubmit: () => void;
  disabled: boolean;
}

/** Screenshot + design goal + feedback intake — step 1 of the round workflow. */
export function UploadForm({ onSubmit, disabled }: UploadFormProps) {
  const screenshotRef = useRoundStore((s) => s.screenshotRef);
  const designGoal = useRoundStore((s) => s.designGoal);
  const feedbackText = useRoundStore((s) => s.feedbackText);
  const reviewerContext = useRoundStore((s) => s.reviewerContext);
  const constraints = useRoundStore((s) => s.constraints);
  const setScreenshotRef = useRoundStore((s) => s.setScreenshotRef);
  const setDesignGoal = useRoundStore((s) => s.setDesignGoal);
  const setFeedbackText = useRoundStore((s) => s.setFeedbackText);
  const setReviewerContext = useRoundStore((s) => s.setReviewerContext);
  const setConstraints = useRoundStore((s) => s.setConstraints);

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      setScreenshotRef(null);
      return;
    }
    // v1 stores a client-side object URL as the screenshot reference; a real upload
    // pipeline (e.g. blob storage) can replace this without changing the round shape.
    setScreenshotRef(URL.createObjectURL(file));
  }

  const canSubmit = !!screenshotRef && designGoal.trim().length > 0 && feedbackText.trim().length > 0;

  return (
    <form
      className="card"
      onSubmit={(event) => {
        event.preventDefault();
        if (canSubmit) onSubmit();
      }}
    >
      <h2>1. Screenshot &amp; feedback</h2>

      <label className="field">
        <span>Screenshot</span>
        <input type="file" accept="image/*" onChange={handleFileChange} disabled={disabled} required />
      </label>

      {screenshotRef && (
        // eslint-disable-next-line @next/next/no-img-element -- local object URL preview, not an optimizable remote asset
        <img src={screenshotRef} alt="Uploaded screenshot preview" className="screenshot-preview" />
      )}

      <label className="field">
        <span>Design goal</span>
        <input
          type="text"
          value={designGoal}
          onChange={(e) => setDesignGoal(e.target.value)}
          placeholder="What is this round trying to achieve?"
          disabled={disabled}
          required
        />
      </label>

      <label className="field">
        <span>Raw feedback</span>
        <textarea
          value={feedbackText}
          onChange={(e) => setFeedbackText(e.target.value)}
          placeholder="Paste the feedback as given, vague parts and all."
          rows={4}
          disabled={disabled}
          required
        />
      </label>

      <label className="field">
        <span>Reviewer context (optional)</span>
        <input
          type="text"
          value={reviewerContext}
          onChange={(e) => setReviewerContext(e.target.value)}
          placeholder="Who gave this feedback, and from what angle?"
          disabled={disabled}
        />
      </label>

      <label className="field">
        <span>Constraints (optional)</span>
        <input
          type="text"
          value={constraints}
          onChange={(e) => setConstraints(e.target.value)}
          placeholder="Anything the directions must respect."
          disabled={disabled}
        />
      </label>

      <button type="submit" disabled={disabled || !canSubmit}>
        {disabled ? "Generating critique…" : "Generate critique"}
      </button>
    </form>
  );
}
