"use client";

import type { Critique } from "@/lib/types";

interface CritiqueDisplayProps {
  critique: Critique;
  onContinue: () => void;
  isGeneratingDirections: boolean;
}

/** Renders the signal-vs-preference critique breakdown — step 2 of the round workflow. */
export function CritiqueDisplay({ critique, onContinue, isGeneratingDirections }: CritiqueDisplayProps) {
  return (
    <section className="panel">
      <div className="panel-title">
        <span className="panel-step">Step 2</span>
        <h2 className="display">Critique</h2>
      </div>
      <p className="panel-lead">{critique.summary}</p>

      <div className="critique-columns">
        <div className="col-signal">
          <h3>Signal — real problems</h3>
          <ul>
            {critique.signal.map((item, i) => (
              <li key={i}>{item.text}</li>
            ))}
          </ul>
        </div>
        <div className="col-preference">
          <h3>Preference — taste</h3>
          <ul>
            {critique.preference.map((item, i) => (
              <li key={i}>{item.text}</li>
            ))}
          </ul>
        </div>
      </div>

      {critique.flaggedAmbiguities.length > 0 && (
        <div className="flagged-ambiguities">
          <h3>Flagged for clarification</h3>
          <ul>
            {critique.flaggedAmbiguities.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
        </div>
      )}

      <p className="model-tag">Model: {critique.model}</p>

      <button type="button" className="btn-primary" onClick={onContinue} disabled={isGeneratingDirections}>
        {isGeneratingDirections && <span className="spinner" role="status" aria-hidden="true" />}
        {isGeneratingDirections ? "Generating directions…" : "Generate directions"}
      </button>
    </section>
  );
}
