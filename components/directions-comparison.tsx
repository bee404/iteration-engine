"use client";

import {
  ROUND_PERSISTENCE_DISABLED_REASON,
  ROUND_PERSISTENCE_ENABLED,
} from "@/lib/round-persistence";
import type { Direction } from "@/lib/types";
import { useRoundStore } from "@/store/round-store";
import { DirectionCard } from "./direction-card";

interface DirectionsComparisonProps {
  directions: Direction[];
  designGoal: string;
  screenshotRef: string | null;
  onApprove: () => void;
  isApproving?: boolean;
  onExport: () => void;
  /** Gated on a selected direction with completed generated code — see round-workspace.tsx. */
  canExport: boolean;
}

/** Side-by-side comparison of the 2-3 generated directions — step 3 of the round workflow. */
export function DirectionsComparison({
  directions,
  designGoal,
  screenshotRef,
  onApprove,
  isApproving,
  onExport,
  canExport,
}: DirectionsComparisonProps) {
  const selectedDirectionId = useRoundStore((s) => s.selectedDirectionId);
  const selectDirection = useRoundStore((s) => s.selectDirection);

  return (
    <section className="panel">
      <div className="panel-title">
        <span className="panel-step">Step 3</span>
        <h2 className="display">Directions</h2>
      </div>
      <div className="directions-grid">
        {directions.map((direction) => (
          <DirectionCard
            key={direction.id}
            direction={direction}
            designGoal={designGoal}
            screenshotRef={screenshotRef}
            isSelected={selectedDirectionId === direction.id}
            onSelect={() => selectDirection(direction.id)}
          />
        ))}
      </div>

      <div className="round-actions">
        {/* Approving is what writes the round to Turso. With persistence off there is nothing for
            it to write to, so it stays disabled rather than reporting a save that never happened. */}
        <button
          type="button"
          className="btn-primary"
          onClick={onApprove}
          disabled={!ROUND_PERSISTENCE_ENABLED || !selectedDirectionId || isApproving}
          title={ROUND_PERSISTENCE_ENABLED ? undefined : ROUND_PERSISTENCE_DISABLED_REASON}
        >
          {isApproving && <span className="spinner" role="status" aria-hidden="true" />}
          {isApproving ? "Saving…" : "Approve round"}
        </button>
        <button type="button" className="btn-secondary" onClick={onExport} disabled={!canExport}>
          Export
        </button>
      </div>
      {!ROUND_PERSISTENCE_ENABLED && <p className="round-actions-note">{ROUND_PERSISTENCE_DISABLED_REASON}</p>}
    </section>
  );
}
