"use client";

import { useCallback, useRef, useState } from "react";
import type { Direction } from "@/lib/types";
import { useRoundStore } from "@/store/round-store";
import { CodeSheet } from "./code-sheet";

interface DirectionCardProps {
  direction: Direction;
  designGoal: string;
  /** The screenshot this round's directions iterate on, forwarded to /api/generate so
   * generated code is grounded in what's actually on screen — not just the direction text. */
  screenshotRef: string | null;
  isSelected: boolean;
  onSelect: () => void;
}

/**
 * One direction in the comparison view, with an optional per-direction "Generate code"
 * action. Consumes the /api/generate SSE stream via fetch + ReadableStream (EventSource
 * only supports GET, and this call needs a POST body).
 */
export function DirectionCard({ direction, designGoal, screenshotRef, isSelected, onSelect }: DirectionCardProps) {
  const [isStreaming, setIsStreaming] = useState(false);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const generateButtonRef = useRef<HTMLButtonElement>(null);
  const generated = useRoundStore((s) => s.generatedCodeByDirection[direction.id]);
  const startCodeGen = useRoundStore((s) => s.startCodeGen);
  const appendCodeToken = useRoundStore((s) => s.appendCodeToken);
  const finalizeCode = useRoundStore((s) => s.finalizeCode);
  const completeCodeGen = useRoundStore((s) => s.completeCodeGen);
  const failCodeGen = useRoundStore((s) => s.failCodeGen);

  const runGeneration = useCallback(async () => {
    setIsStreaming(true);
    startCodeGen(direction.id, "tsx");

    try {
      if (!screenshotRef) {
        throw new Error("This round has no screenshot to ground code generation in.");
      }

      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ direction, designGoal, screenshotRef }),
      });

      if (!response.ok || !response.body) {
        throw new Error(`Generation request failed (${response.status})`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        // SSE frames are separated by a blank line.
        const frames = buffer.split("\n\n");
        buffer = frames.pop() ?? "";

        for (const frame of frames) {
          const eventLine = frame.split("\n").find((line) => line.startsWith("event: "));
          const dataLine = frame.split("\n").find((line) => line.startsWith("data: "));
          if (!eventLine || !dataLine) continue;

          const event = eventLine.slice("event: ".length);
          const data = JSON.parse(dataLine.slice("data: ".length));

          if (event === "token") appendCodeToken(direction.id, data.token);
          // The pipeline's deterministic post-processing runs after streaming; "code" carries
          // the authoritative cleaned source (fences stripped, colors normalized, font
          // injected) that replaces the raw streamed buffer, plus any QA warnings.
          if (event === "code") {
            const warnings: string[] = Array.isArray(data.warnings)
              ? data.warnings.map((warning: { message: string }) => warning.message)
              : [];
            finalizeCode(direction.id, data.code, warnings);
          }
          if (event === "error") throw new Error(data.message);
        }
      }

      completeCodeGen(direction.id);
    } catch (error) {
      failCodeGen(direction.id, error instanceof Error ? error.message : "Generation failed");
    } finally {
      setIsStreaming(false);
    }
  }, [direction, designGoal, screenshotRef, startCodeGen, appendCodeToken, finalizeCode, completeCodeGen, failCodeGen]);

  // Generating starts the stream and opens the sheet together. Once a direction has completed
  // output, re-clicking just reopens the sheet instead of re-streaming; a fresh direction or one
  // that errored kicks off a new /api/generate call (same retry-on-error behavior as before).
  const handleTriggerClick = useCallback(() => {
    setIsSheetOpen(true);
    if (!generated || generated.status === "error") {
      void runGeneration();
    }
  }, [generated, runGeneration]);

  const handleSheetClose = useCallback(() => {
    setIsSheetOpen(false);
  }, []);

  return (
    <article className={`direction-card ${isSelected ? "selected" : ""}`}>
      <header>
        <h3>{direction.title}</h3>
        <button type="button" onClick={onSelect} className={isSelected ? "selected-badge" : "select-button"}>
          {isSelected ? "Selected" : "Select"}
        </button>
      </header>

      <p className="rationale">{direction.rationale}</p>

      <div className="tradeoffs">
        <strong>Tradeoffs:</strong> {direction.tradeoffs}
      </div>

      <ul className="change-list">
        {direction.suggestedChanges.map((change, i) => (
          <li key={i}>{change}</li>
        ))}
      </ul>

      {direction.patternReference && (
        <a
          href={direction.patternReference.url}
          target="_blank"
          rel="noreferrer"
          className="pattern-reference"
          title={`Pattern reference: ${direction.patternReference.name}`}
        >
          Pattern reference
        </a>
      )}

      <button
        type="button"
        ref={generateButtonRef}
        onClick={handleTriggerClick}
        disabled={isStreaming}
        className="btn-secondary"
      >
        {isStreaming && <span className="spinner" role="status" aria-hidden="true" />}
        {isStreaming
          ? "Streaming code…"
          : generated?.status === "complete"
            ? "View generated code"
            : generated?.status === "error"
              ? "Retry generation"
              : "Generate code (optional)"}
      </button>

      <CodeSheet
        isOpen={isSheetOpen}
        directionTitle={direction.title}
        generated={generated}
        onClose={handleSheetClose}
        triggerRef={generateButtonRef}
      />
    </article>
  );
}
