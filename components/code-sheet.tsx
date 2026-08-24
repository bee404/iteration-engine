"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import type { RefObject } from "react";
import type { GeneratedCodeStatus, ImageDimensions } from "@/lib/types";
import { ComparisonViewport } from "./comparison-viewport";

// `useLayoutEffect` warns when it runs during SSR (it can't affect server output). This falls
// back to `useEffect` on the server — a no-op there — and stays `useLayoutEffect` on the
// client, which is the piece that actually needs to run before paint (see the streaming→
// complete height pin below).
const useIsomorphicLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

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
  /** Data URL of the round's reference screenshot — the comparison's `Source` position. */
  screenshotRef: string | null;
  /** The fixed box both comparison layers render into (see `resolveComparisonViewport`). */
  viewport: ImageDimensions | null;
  onClose: () => void;
  /** Focus returns here when the sheet closes, so keyboard users land back where they started. */
  triggerRef: RefObject<HTMLButtonElement | null>;
}

const FOCUSABLE_SELECTOR =
  'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

/**
 * Full-width bottom sheet for a direction's generated-code preview. A completed direction is
 * itself a UI, so it gets the full viewport's height to breathe. While code is still streaming
 * there's nothing useful to read yet, so the sheet collapses to a compact partial-height status
 * panel instead of dumping raw source scrolling by; it expands to full height the instant the
 * stream settles (complete or error). Mounted only while open or animating closed, so the slide
 * transition can play in both directions; dismissible via the close button, a scrim click, or
 * Escape.
 */
export function CodeSheet({
  isOpen,
  directionTitle,
  generated,
  screenshotRef,
  viewport,
  onClose,
  triggerRef,
}: CodeSheetProps) {
  // While streaming, collapse the sheet to a partial-height status panel (see body below).
  const isStreaming = generated?.status === "streaming";
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
  const wasStreamingRef = useRef(isStreaming);
  const streamingHeightRef = useRef<number | null>(null);

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

  // Keep a live pixel snapshot of the sheet's compact streaming height, refreshed whenever the
  // streamed content changes (so the panel can grow/shrink with each chunk). Deliberately scoped
  // to `[isStreaming, generated]` rather than every render: an unconditional layout effect forces
  // a synchronous reflow on *every* commit, including the ones that drive the close/scrim slide
  // transition, which was enough to desync that transition from the browser's paint and swallow
  // its `transitionend` (breaking the close-button/scrim/Escape dismissal). Scoping to content
  // changes keeps the reflow to the commits that actually need it.
  useIsomorphicLayoutEffect(() => {
    if (isStreaming && sheetRef.current) {
      streamingHeightRef.current = sheetRef.current.getBoundingClientRect().height;
    }
  }, [isStreaming, generated]);

  // When the stream settles, `.is-streaming` drops off and the sheet's CSS height jumps from
  // `auto` (compact status panel) to a fixed 85vh. CSS can't transition to/from `auto`, so we
  // pin the sheet at its last known compact pixel height, then release the pin a frame later —
  // the browser now has two concrete values (pinned px, target 85vh) to ease between instead of
  // snapping. This must run as a layout effect: by the time a normal `useEffect` fires, React
  // has already committed the class change *and* the browser has already painted the jumped-to
  // 85vh frame, so there's nothing left to pin. This only runs on the streaming→complete edge;
  // the reverse never happens in this UI, and `isOpen` is untouched, so it can't interfere with
  // the open/close slide transition below.
  useIsomorphicLayoutEffect(() => {
    const streamingJustEnded = wasStreamingRef.current && !isStreaming;
    wasStreamingRef.current = isStreaming;
    if (!streamingJustEnded) return;
    const sheet = sheetRef.current;
    const startHeight = streamingHeightRef.current;
    if (!sheet || startHeight == null) return;

    sheet.style.height = `${startHeight}px`;
    // The pinned value is numerically identical to what was already on screen, so nothing looks
    // different yet — forcing a synchronous layout read makes the browser commit *this* value as
    // a real rendered frame rather than folding it into the next style recalculation. A single
    // requestAnimationFrame callback still runs *before* that frame paints, so releasing the pin
    // there would again collapse both writes into one recalc; waiting for a second frame
    // guarantees a full paint happened at the pinned height first, giving the transition an
    // actual prior frame to ease away from.
    void sheet.offsetHeight;
    let pendingFrame = 0;
    const releaseFrame = requestAnimationFrame(() => {
      pendingFrame = requestAnimationFrame(() => {
        sheet.style.height = "";
      });
    });
    return () => {
      cancelAnimationFrame(releaseFrame);
      cancelAnimationFrame(pendingFrame);
    };
  }, [isStreaming]);

  // `onTransitionEnd` now fires for both the open/close slide (`transform`) and the
  // streaming→complete expand (`height`). Only the close case should unmount, and `isOpen` is
  // false only for that case, so the two transitions can't cross-trigger an unwanted unmount.
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
        className={`code-sheet ${isActive ? "open" : ""} ${isStreaming ? "is-streaming" : ""}`}
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
          {!generated ? (
            <p className="code-status">Nothing generated yet.</p>
          ) : isStreaming ? (
            // No raw code dump while streaming — just a contextual status line at partial height.
            <div className="code-sheet-streaming" role="status" aria-live="polite">
              <span className="spinner" aria-hidden="true" />
              <p>Generating component for “{directionTitle}”…</p>
            </div>
          ) : (
            // Once the stream settles the body becomes the comparison: a Source/Iteration toggle
            // over one fixed viewport box. `error` is threaded through so a failed generation
            // shows the explicit fallback banner inside that same box rather than a bannerless
            // read-only source view (the "silent stall").
            <ComparisonViewport
              screenshotRef={screenshotRef}
              viewport={viewport}
              code={generated.code}
              language={generated.language}
              status={generated.status}
              error={generated.error}
            />
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
