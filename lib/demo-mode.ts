/**
 * Single source of truth for demo/fixture replay mode.
 *
 * When DEMO_MODE=true:
 *  - every provider factory (lib/providers/**) returns a fixture-backed implementation that
 *    replays real, previously-captured critique / directions / code-gen output instead of
 *    calling a live model — zero external API calls.
 *  - every persistence write (lib/db/queries.ts, the POST/PATCH routes) is refused, so a
 *    demo walkthrough can never write fixture data to Turso.
 *
 * This flag is checked FIRST in each factory, ahead of LLM_PROVIDER / CODEGEN_PROVIDER /
 * ANTHROPIC_API_KEY, so flipping it on guarantees the live path is fully bypassed regardless
 * of what other provider env vars are set. Flipping it off restores normal behavior exactly —
 * no fixture code sits on the live path.
 */
export function isDemoMode(): boolean {
  return process.env.DEMO_MODE?.trim().toLowerCase() === "true";
}

/**
 * Guard for write paths. Throwing (rather than silently no-oping deep in a query) keeps the
 * refusal loud and close to the caller, and gives the route a typed error to surface. Callers
 * that can short-circuit earlier (the API routes) should do so before reaching the DB layer;
 * this is the defense-in-depth backstop so no write can execute even if a new caller forgets.
 */
export function assertWritesAllowed(operation: string): void {
  if (isDemoMode()) {
    throw new Error(`Refusing "${operation}": persistence is disabled while DEMO_MODE is on.`);
  }
}

