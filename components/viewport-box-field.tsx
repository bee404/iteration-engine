"use client";

import { useCallback, useState } from "react";

import { useChainViewport, type ChainViewport } from "@/lib/stores/chain-viewport";
import {
  formatViewportBox,
  parseViewportBox,
  toViewportBoxDraft,
  type ViewportBoxDraft,
} from "@/lib/viewport-box";

type EditorState =
  | { status: "idle" }
  | { status: "editing"; draft: ViewportBoxDraft; error: string | null };

function readout(viewport: ChainViewport): string {
  switch (viewport.status) {
    case "unmeasured":
      return "Viewport not measured yet";
    case "open":
      return `Viewport ${formatViewportBox(viewport.box)} \u00b7 ${
        viewport.source === "inferred" ? "inferred" : "corrected"
      }`;
    case "locked":
      return `Viewport ${formatViewportBox(viewport.box)} \u00b7 locked for this chain`;
  }
}

/**
 * The inferred viewport box, shown before synthesis with a correction affordance while the chain
 * is still open (Decision 14). Once the chain's first iteration is committed the box is locked and
 * this reads out as a fact — the correction control is gone for good, not merely disabled, so a
 * later round can never look like an invitation to re-measure.
 *
 * Interaction-first pass: it uses existing caption/field tokens rather than a Figma frame, which
 * does not exist for this control yet.
 */
export function ViewportBoxField() {
  const viewport = useChainViewport((state) => state.viewport);
  const correctBox = useChainViewport((state) => state.correctBox);
  const [editor, setEditor] = useState<EditorState>({ status: "idle" });

  const openEditor = useCallback(() => {
    const box = viewport.status === "unmeasured" ? null : viewport.box;
    setEditor({ status: "editing", draft: toViewportBoxDraft(box), error: null });
  }, [viewport]);

  const editDraft = useCallback((patch: Partial<ViewportBoxDraft>) => {
    setEditor((current) =>
      current.status === "editing"
        ? { status: "editing", draft: { ...current.draft, ...patch }, error: null }
        : current,
    );
  }, []);

  const submitCorrection = useCallback(() => {
    setEditor((current) => {
      if (current.status !== "editing") return current;
      const parsed = parseViewportBox(current.draft);
      if (parsed.status === "invalid") return { ...current, error: parsed.message };
      correctBox(parsed.box);
      return { status: "idle" };
    });
  }, [correctBox]);

  if (viewport.status === "locked") {
    return (
      <p className="viewport-box is-locked">
        <span className="viewport-box-readout">{readout(viewport)}</span>
      </p>
    );
  }

  if (editor.status === "idle") {
    return (
      <p className="viewport-box">
        <span className="viewport-box-readout">{readout(viewport)}</span>
        <button type="button" className="viewport-box-action" onClick={openEditor}>
          {viewport.status === "unmeasured" ? "Set it" : "Correct"}
        </button>
      </p>
    );
  }

  return (
    <form
      className="viewport-box is-editing"
      onSubmit={(event) => {
        event.preventDefault();
        submitCorrection();
      }}
    >
      <label className="viewport-box-field">
        <span>Width</span>
        <input
          className="viewport-box-input"
          inputMode="numeric"
          autoFocus
          value={editor.draft.width}
          onChange={(event) => editDraft({ width: event.target.value })}
          aria-invalid={editor.error !== null}
        />
      </label>
      <span className="viewport-box-times" aria-hidden="true">
        ×
      </span>
      <label className="viewport-box-field">
        <span>Height</span>
        <input
          className="viewport-box-input"
          inputMode="numeric"
          value={editor.draft.height}
          onChange={(event) => editDraft({ height: event.target.value })}
          aria-invalid={editor.error !== null}
        />
      </label>
      <button type="submit" className="viewport-box-action is-primary">
        Save
      </button>
      <button type="button" className="viewport-box-action" onClick={() => setEditor({ status: "idle" })}>
        Cancel
      </button>
      {editor.error && (
        <span className="viewport-box-error" role="alert">
          {editor.error}
        </span>
      )}
    </form>
  );
}

