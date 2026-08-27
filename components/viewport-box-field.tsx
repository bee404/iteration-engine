"use client";

import { useCallback, useState } from "react";

import { useRoundViewport, type RoundViewport } from "@/lib/stores/round-viewport";
import {
  formatViewportBox,
  parseViewportBox,
  toViewportBoxDraft,
  type ViewportBoxDraft,
} from "@/lib/viewport-box";

type EditorState =
  | { status: "idle" }
  | { status: "editing"; draft: ViewportBoxDraft; error: string | null };

function readout(viewport: RoundViewport): string {
  switch (viewport.status) {
    case "unmeasured":
      return "Viewport not measured yet";
    case "open":
      return `Viewport ${formatViewportBox(viewport.box)} \u00b7 ${
        viewport.source === "inferred" ? "inferred" : "corrected"
      }`;
    case "locked":
      return `Viewport ${formatViewportBox(viewport.box)} \u00b7 locked for this exploration`;
  }
}

/**
 * The exploration's box on screens with no reference image to hang it under: the /upload dropzone, and
 * the /feedback empty state after a reload. Renders only once the box is locked — an open,
 * still-correctable measurement belongs to a screenshot that isn't on screen, and offering the
 * correction control there would invite a correction with nothing to check it against.
 */
export function LockedViewportNotice() {
  const viewport = useRoundViewport((state) => state.viewport);
  if (viewport.status !== "locked") return null;
  return (
    <p className="viewport-box is-locked">
      <span className="viewport-box-readout">{readout(viewport)}</span>
    </p>
  );
}

/**
 * The inferred viewport box, shown before synthesis with a correction affordance while the round
 * is still open. Once generation starts the box is locked and
 * this reads out as a fact — the correction control is gone for good, not merely disabled, so a
 * later round can never look like an invitation to re-measure.
 *
 * Interaction-first pass: it uses existing caption/field tokens rather than a Figma frame, which
 * does not exist for this control yet.
 */
export function ViewportBoxField() {
  const viewport = useRoundViewport((state) => state.viewport);
  const correctBox = useRoundViewport((state) => state.correctBox);
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

  // The parse and the store write both happen here in the event handler, never inside a
  // `setEditor` updater: React may run an updater during the render phase, so writing to the
  // round-viewport store from inside one updates other subscribers mid-render ("Cannot update a
  // component while rendering a different component"). Updaters stay pure; effects stay outside.
  const submitCorrection = useCallback(() => {
    if (editor.status !== "editing") return;
    const parsed = parseViewportBox(editor.draft);
    if (parsed.status === "invalid") {
      setEditor({ status: "editing", draft: editor.draft, error: parsed.message });
      return;
    }
    correctBox(parsed.box);
    setEditor({ status: "idle" });
  }, [editor, correctBox]);

  if (viewport.status === "locked") {
    return <LockedViewportNotice />;
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
