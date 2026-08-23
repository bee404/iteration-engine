import type {
  ApprovalStatus,
  Critique,
  Direction,
  GeneratedCode,
  ImageDimensions,
  Project,
  Round,
} from "@/lib/types";

/**
 * Draft shape of the in-progress round, taken straight from the Zustand store at the
 * moment of approval. Kept separate from `Round` (the persisted shape) because a draft
 * has no id/projectId/timestamps yet — those are assigned by the server on write.
 */
export interface RoundDraft {
  screenshotRef: string | null;
  screenshotDimensions: ImageDimensions | null;
  /** The box this chain locked, as the client knows it. Only used when this round opens the
   *  chain — a continuing round inherits the box already locked upstream. */
  lockedViewport: ImageDimensions | null;
  designGoal: string;
  feedbackText: string;
  reviewerContext: string;
  constraints: string;
  critique: Critique | null;
  directions: Direction[];
  selectedDirectionId: string | null;
  generatedCodeByDirection: Record<string, { status: GeneratedCode["status"]; code: string; language: string }>;
  approvalStatus: ApprovalStatus;
}

export type PersistRoundResult =
  | { status: "persisted"; round: Round }
  | { status: "demo_mode" }
  | { status: "error"; message: string };

/**
 * The app has no project-switcher UI yet (single-workspace V1) — every round belongs to
 * this implicit project, created lazily on first approval. Keeping the name here (rather
 * than a fresh generateName-type helper) keeps the "one implicit project" decision in one
 * obvious place until real project management ships.
 */
const DEFAULT_PROJECT_NAME = "Default Project";

interface ApiErrorBody {
  error?: string;
  code?: string;
}

async function readJson<T>(response: Response): Promise<T | null> {
  return response.json().catch(() => null);
}

function isDemoModeRefusal(response: Response, body: ApiErrorBody | null): boolean {
  return response.status === 403 && body?.code === "demo_mode";
}

/**
 * Resolves the single implicit project, creating it on first use. Returns `{ demoMode: true }`
 * instead of throwing when creation is refused, so callers can distinguish "nothing to persist
 * to because demo mode is on" from a real failure.
 */
async function ensureProjectId(): Promise<string | { demoMode: true }> {
  const existing = await fetchFirstProjectId();
  if (existing) return existing;

  const createResponse = await fetch("/api/projects", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: DEFAULT_PROJECT_NAME }),
  });
  const createBody = await readJson<{ project: Project } & ApiErrorBody>(createResponse);
  if (isDemoModeRefusal(createResponse, createBody)) return { demoMode: true };
  if (!createResponse.ok || !createBody?.project) {
    throw new Error(createBody?.error ?? `Failed to create default project (${createResponse.status})`);
  }
  return createBody.project.id;
}

/** The single implicit project as it already exists, or null when nothing has been persisted yet
 *  (a fresh database, or a demo-mode session that never wrote one). */
async function fetchFirstProjectId(): Promise<string | null> {
  const response = await fetch("/api/projects");
  const body = await readJson<{ projects: Project[] }>(response);
  if (!response.ok || !body) {
    throw new Error(`Failed to list projects (${response.status})`);
  }
  return body.projects[0]?.id ?? null;
}

/** Most recent round for the project, if any — the round the new one chains onto. */
async function fetchLatestRound(projectId: string): Promise<Round | null> {
  const response = await fetch(`/api/rounds?projectId=${encodeURIComponent(projectId)}`);
  const body = await readJson<{ rounds: Round[] }>(response);
  if (!response.ok || !body) {
    throw new Error(`Failed to load round history (${response.status})`);
  }
  return body.rounds[0] ?? null;
}

/**
 * The viewport box belongs to the chain, so a round that continues one carries the box locked
 * upstream rather than whatever its own reference happens to measure (Decision 14). Only the
 * round that opens a chain contributes a box of its own.
 */
function resolveLockedViewport(previousRound: Round | null, draft: RoundDraft): ImageDimensions | null {
  return previousRound?.lockedViewport ?? draft.lockedViewport;
}

/**
 * The box this chain already locked, as the server knows it — the durable counterpart to the
 * in-memory store, read on load so a hard reload mid-chain does not re-open a committed box
 * (Decision 14). Null when no round has been persisted yet or the chain never locked one.
 *
 * Throws on a genuine transport/API failure; the caller decides whether a failed rehydrate is
 * worth surfacing. It never invents a box — an unreachable API leaves the chain unmeasured.
 */
export async function fetchChainLockedViewport(): Promise<ImageDimensions | null> {
  const projectId = await fetchFirstProjectId();
  if (!projectId) return null;
  const latestRound = await fetchLatestRound(projectId);
  return latestRound?.lockedViewport ?? null;
}

/**
 * Persists an approved round to Turso: resolves (or creates) the implicit project, chains
 * the round onto the project's most recent round via previousRoundId, then writes it. Every
 * write this triggers passes through the same demo-mode-guarded API routes as everything
 * else (see app/api/rounds/route.ts, app/api/projects/route.ts) — demo mode is never
 * bypassed here, just surfaced as a typed result instead of a thrown 403.
 */
export async function persistApprovedRound(draft: RoundDraft): Promise<PersistRoundResult> {
  try {
    const projectId = await ensureProjectId();
    if (typeof projectId !== "string") return { status: "demo_mode" };

    const previousRound = await fetchLatestRound(projectId);

    const generatedCode = Object.entries(draft.generatedCodeByDirection).map(([directionId, entry]) => ({
      directionId,
      language: entry.language,
      code: entry.code,
      status: entry.status,
    }));

    const response = await fetch("/api/rounds", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        projectId,
        previousRoundId: previousRound?.id ?? null,
        screenshotRef: draft.screenshotRef ?? "",
        screenshotDimensions: draft.screenshotDimensions,
        lockedViewport: resolveLockedViewport(previousRound, draft),
        designGoal: draft.designGoal,
        feedbackText: draft.feedbackText,
        reviewerContext: draft.reviewerContext || null,
        constraints: draft.constraints || null,
        critique: draft.critique,
        directions: draft.directions,
        selectedDirectionId: draft.selectedDirectionId,
        generatedCode,
        approvalStatus: draft.approvalStatus,
      }),
    });
    const body = await readJson<{ round: Round } & ApiErrorBody>(response);

    if (isDemoModeRefusal(response, body)) return { status: "demo_mode" };
    if (!response.ok || !body?.round) {
      return { status: "error", message: body?.error ?? `Persist failed (${response.status})` };
    }

    return { status: "persisted", round: body.round };
  } catch (error) {
    return { status: "error", message: error instanceof Error ? error.message : "Persist failed" };
  }
}

