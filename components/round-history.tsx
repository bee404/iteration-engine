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
 * Renders its own loading/empty/error states since it fetches independently of the store.
 */
export function RoundHistory({ refreshKey }: RoundHistoryProps) {
  const [rounds, setRounds] = useState<Round[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setError(null);
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
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load round history");
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

  return (
    <section className="card">
      <h2>History</h2>

      {error && <p className="error">{error}</p>}

      {!error && rounds === null && <p className="model-tag">Loading round history…</p>}

      {!error && rounds !== null && rounds.length === 0 && (
        <p className="model-tag">No rounds saved yet. Approve a round to start building iteration history.</p>
      )}

      {!error && rounds !== null && rounds.length > 0 && (
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
      )}
    </section>
  );
}

