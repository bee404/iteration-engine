"use client";

import { useEffect, useState } from "react";
import type { Project, Round } from "@/lib/types";

interface RoundHistoryProps {
  /** Bump this after a successful persist to force a refetch. */
  refreshKey: number;
}

/**
 * Cap on how many prior rounds we surface at once — matches the product requirement to
 * compare versions across up to 4-5 rounds per view rather than an unbounded list.
 */
const MAX_VISIBLE_ROUNDS = 5;

/**
 * Reads back persisted rounds for the implicit project so iteration history is queryable
 * from the same workspace that writes it — step 4 of the round workflow, after approval.
 *
 * History only makes sense once a round has actually been saved: on a fresh app (no
 * project yet, no rounds yet, or a load failure with nothing already shown) this renders
 * nothing rather than a loading placeholder, an "empty" message, or an error banner. The
 * write path (persist-round.ts, surfaced via the approve-round banner) is the place real
 * persistence failures get shown to the user — a failed *read* of an optional, contextual
 * section shouldn't alarm anyone. Load failures are still logged to the console so they're
 * not silently lost for diagnostics.
 */
export function RoundHistory({ refreshKey }: RoundHistoryProps) {
  const [rounds, setRounds] = useState<Round[] | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const projectsResponse = await fetch("/api/projects");
        if (!projectsResponse.ok) throw new Error(`Failed to load projects (${projectsResponse.status})`);
        const { projects } = (await projectsResponse.json()) as { projects: Project[] };
        const project = projects[0];

        if (!project) {
          if (!cancelled) setRounds([]);
          return;
        }

        const roundsResponse = await fetch(`/api/rounds?projectId=${encodeURIComponent(project.id)}`);
        if (!roundsResponse.ok) throw new Error(`Failed to load round history (${roundsResponse.status})`);
        const { rounds: fetchedRounds } = (await roundsResponse.json()) as { rounds: Round[] };
        if (!cancelled) setRounds(fetchedRounds);
      } catch (err) {
        console.error("Failed to load round history:", err);
        if (!cancelled) setRounds([]);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

  if (!rounds || rounds.length === 0) return null;

  return (
    <section className="panel">
      <div className="panel-title">
        <span className="panel-step">Step 4</span>
        <h2 className="display">History</h2>
      </div>

      <ul className="round-history-list">
        {rounds.slice(0, MAX_VISIBLE_ROUNDS).map((round) => (
          <li key={round.id} className="round-history-item">
            <div className="round-history-meta">
              <span className={`round-history-status round-history-status-${round.approvalStatus}`}>
                {round.approvalStatus}
              </span>
              <span className="model-tag">{new Date(round.createdAt).toLocaleString()}</span>
            </div>
            <p className="round-history-goal">{round.designGoal}</p>
            {round.previousRoundId && (
              <p className="model-tag">Iterates on round {round.previousRoundId.slice(0, 8)}</p>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}

