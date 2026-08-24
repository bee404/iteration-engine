import type { Critique, Direction } from "@/lib/types";

/**
 * The browser-side contract for the two model routes. Both `/api/critique` and `/api/directions`
 * always answer with a typed `{ error, code }` JSON body on failure (see their route handlers),
 * so failures are described here once rather than each screen inventing its own wording.
 *
 * This module exists because the stepped round flow (/upload -> /feedback -> /directions) and the
 * single-page workspace both need to call the same two endpoints. When only the workspace called
 * them, the stepped flow silently drifted into rendering fixtures instead — one shared caller is
 * what keeps a second screen from quietly going offline again.
 */

export interface CritiqueRequest {
  screenshotRef: string;
  designGoal: string;
  feedbackText: string;
  reviewerContext?: string;
  constraints?: string;
}

export interface DirectionsRequest {
  critique: Critique;
  designGoal: string;
  feedbackText: string;
  constraints?: string;
}

interface TypedErrorBody {
  error?: unknown;
  code?: unknown;
}

/**
 * Prefers the route's own message ("Anthropic request failed (upstream_error)") over a bare status
 * code, which tells a reviewer nothing about whether they hit an invalid screenshot, a provider
 * outage, or a real bug.
 */
async function describeFailure(response: Response, label: string): Promise<string> {
  const body: TypedErrorBody | null = await response.json().catch(() => null);
  if (body && typeof body.error === "string") {
    return typeof body.code === "string" ? `${body.error} (${body.code})` : body.error;
  }
  return `${label} request failed (${response.status})`;
}

async function postJson<T>(path: string, label: string, payload: unknown): Promise<T> {
  const response = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    // The model routes are per-round and non-idempotent; never let a CDN or the browser HTTP
    // cache answer one of these with a previous round's result.
    cache: "no-store",
    body: JSON.stringify(payload),
  });
  if (!response.ok) throw new Error(await describeFailure(response, label));
  return (await response.json()) as T;
}

/** Live critique for one round. Throws with the route's typed message on any failure. */
export async function requestCritique(request: CritiqueRequest): Promise<Critique> {
  const data = await postJson<{ critique: Critique }>("/api/critique", "Critique", request);
  return data.critique;
}

/** The three live directions grounded in the given critique. Throws on any failure. */
export async function requestDirections(request: DirectionsRequest): Promise<Direction[]> {
  const data = await postJson<{ directions: Direction[] }>("/api/directions", "Directions", request);
  return data.directions;
}
