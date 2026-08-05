"use client";

import type { Direction } from "@/lib/types";
import { useRoundStore } from "@/store/round-store";
import { DirectionCard } from "./direction-card";

interface DirectionsComparisonProps {
  directions: Direction[];
  designGoal: string;
  onApprove: () => void;
}

/** Side-by-side comparison of the 2-3 generated directions — step 3 of the round workflow. */
export function DirectionsComparison({ directions, designGoal, onApprove }: DirectionsComparisonProps) {
  const selectedDirectionId = useRoundStore((s) => s.selectedDirectionId);
  const selectDirection = useRoundStore((s) => s.selectDirection);

  return (
    <section className="card">
      <h2>3. Directions</h2>
      <div className="directions-grid">
        {directions.map((direction) => (
          <DirectionCard
            key={direction.id}
            direction={direction}
            designGoal={designGoal}
            isSelected={selectedDirectionId === direction.id}
            onSelect={() => selectDirection(direction.id)}
          />
        ))}
      </div>

      <button type="button" onClick={onApprove} disabled={!selectedDirectionId}>
        Approve round
      </button>
    </section>
  );
}
