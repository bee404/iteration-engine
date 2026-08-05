"use client";

import { useCallback, useState } from "react";
import type { Direction } from "@/lib/types";
import { useRoundStore } from "@/store/round-store";
import { PreviewFrame } from "./preview-frame";

interface DirectionCardProps {
  direction: Direction;
  designGoal: string;
  isSelected: boolean;
  onSelect: () => void;
}

/**
 * One direction in the comparison view, with an optional per-direction "Generate code"
 * action. Consumes the /api/generate SSE stream via fetch + ReadableStream (EventSource
 * only supports GET, and this call needs a POST body).
 */
export function DirectionCard({ direction, designGoal, isSelected, onSelect }: DirectionCardProps) {
  const [isStreaming, setIsStreaming] = useState(false);
  const generated = useRoundStore((s) => s.generatedCodeByDirection[direction.id]);
  const startCodeGen = useRoundStore((s) => s.startCodeGen);
  const appendCodeToken = useRoundStore((s) => s.appendCodeToken);
  const completeCodeGen = useRoundStore((s) => s.completeCodeGen);
  const failCodeGen = useRoundStore((s) => s.failCodeGen);

  const handleGenerate = useCallback(async () => {
    setIsStreaming(true);
    startCodeGen(direction.id, "tsx");

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ direction, designGoal }),
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
          if (event === "error") throw new Error(data.message);
        }
      }

      completeCodeGen(direction.id);
    } catch (error) {
      failCodeGen(direction.id, error instanceof Error ? error.message : "Generation failed");
    } finally {
      setIsStreaming(false);
    }
  }, [direction, designGoal, startCodeGen, appendCodeToken, completeCodeGen, failCodeGen]);

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

      <ul>
        {direction.suggestedChanges.map((change, i) => (
          <li key={i}>{change}</li>
        ))}
      </ul>

      {direction.patternReference && (
        <a href={direction.patternReference.url} target="_blank" rel="noreferrer" className="pattern-reference">
          Grounded in: {direction.patternReference.name} ({direction.patternReference.source})
        </a>
      )}

      <button type="button" onClick={handleGenerate} disabled={isStreaming} className="generate-button">
        {isStreaming ? "Streaming code…" : "Generate code (optional)"}
      </button>

      {generated && (
        <div className="code-preview">
          <PreviewFrame code={generated.code} language={generated.language} />
          <p className="code-status">
            Status: {generated.status}
            {generated.error ? ` — ${generated.error}` : ""}
          </p>
        </div>
      )}
    </article>
  );
}
