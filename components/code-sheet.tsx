"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { RefObject } from "react";
import type { GeneratedCodeStatus } from "@/lib/types";
import { PreviewFrame } from "./preview-frame";

interface GeneratedCodeState {
  status: GeneratedCodeStatus;
  code: string;
  language: string;
  error?: string;
  /** QA notes from the codegen post-processing stage (off-palette rewrites, emoji icons). */
  warnings?: string[];
}

interface CodeSheetProps {
  isOpen: boolean;
  directionTitle: string;
  generated: GeneratedCodeState | undefined;
  onClose: () => void;
  /** Focus returns here when the sheet closes, so keyboard users land back where they started. */
  triggerRef: RefObject<HTMLButtonElement | null>;
}

const FOCUSABLE_SELECTOR =
  'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

/**
 * Full-width bottom sheet for a direction's generated-code preview. Generated output is
 * itself a UI, so it gets the full viewport's height to breathe instead of being squeezed
 * into the direction card. Mounted only while open or animating closed, so the slide
 * transition can play in both directions; dismissible via the close button, a scrim click,
 * or Escape. Streaming/error rendering is untouched — this only changes where it's shown.
 */
export function CodeSheet({ isOpen, directionTitle, generated, onClose, triggerRef }: CodeSheetProps) {
  const [isMounted, setIsMounted] = useState(isOpen);
  // The `.open` class drives the slide/fade. It must be applied one frame *after* the sheet
  // first paints in its closed position, or the CSS transition has no prior state to animate
  // from and the enter animation is skipped (the exit works because the mounted sheet already
  // carries `.open` when it's removed). So mounting and activating are two separate states.
  const [isActive, setIsActive] = useState(isOpen);
  // Render-phase mount when opening; unmount happens from the transitionend handler below once
  // the slide-down has finished.
  const [trackedIsOpen, setTrackedIsOpen] = useState(isOpen);
  if (isOpen !== trackedIsOpen) {
    setTrackedIsOpen(isOpen);
    if (isOpen) setIsMounted(true);
    // Closing: drop `.open` now (render phase) so the exit transition plays before unmount.
    else setIsActive(false);
  }
  const sheetRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const wasOpenRef = useRef(false);

  useEffect(() => {
    if (isOpen) {
      closeButtonRef.current?.focus();
      wasOpenRef.current = true;
    } else if (wasOpenRef.current) {
      wasOpenRef.current = false;
      triggerRef.current?.focus();
    }
  }, [isOpen, triggerRef]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
        return;
      }
      if (event.key !== "Tab" || !sheetRef.current) return;

      // Minimal focus trap: wrap Tab/Shift+Tab within the sheet's focusable elements.
      const focusable = Array.from(sheetRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR));
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (!first || !last) return;

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Add `.open` on the frame after mount so the enter transition animates from the closed
  // position rather than snapping open. (Closing is handled in the render phase above.)
  useEffect(() => {
    if (!isOpen) return;
    const frame = requestAnimationFrame(() => setIsActive(true));
    return () => cancelAnimationFrame(frame);
  }, [isOpen]);

  const handleTransitionEnd = useCallback(() => {
    if (!isOpen) setIsMounted(false);
  }, [isOpen]);

  if (!isMounted) return null;

  return (
    <div
      className={`code-sheet-scrim ${isActive ? "open" : ""}`}
      aria-hidden={!isOpen}
      onClick={onClose}
    >
      <div
        ref={sheetRef}
        className={`code-sheet ${isActive ? "open" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-label={`Generated code for ${directionTitle}`}
        onClick={(event) => event.stopPropagation()}
        onTransitionEnd={handleTransitionEnd}
      >
        <header className="code-sheet-header">
          <div>
            <span className="code-sheet-label">Generated code</span>
            <h3>{directionTitle}</h3>
          </div>
          <button
            type="button"
            ref={closeButtonRef}
            onClick={onClose}
            className="code-sheet-close"
            aria-label="Close generated code preview"
          >
            ✕
          </button>
        </header>

        <div className="code-sheet-body">
          {generated ? (
            <PreviewFrame
              code={generated.code}
              language={generated.language}
              status={generated.status}
              error={generated.error}
            />
          ) : (
            <p className="code-status">Nothing generated yet.</p>
          )}
        </div>

        {generated && (
          <p className="code-status">
            Status: {generated.status}
            {generated.error ? ` — ${generated.error}` : ""}
          </p>
        )}

        {generated?.warnings && generated.warnings.length > 0 && (
          <ul className="code-warnings" aria-label="Design-system post-processing warnings">
            {generated.warnings.map((warning) => (
              <li key={warning}>{warning}</li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
