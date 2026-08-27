/**
 * Single source of truth for demo/fixture replay mode.
 *
 * When DEMO_MODE=true:
 *  - every provider factory (lib/providers/**) returns a fixture-backed implementation that
 *    replays real, previously-captured critique / directions / code-gen output instead of
 *    calling a live model — zero external API calls.
 *
 * This flag is checked FIRST in each factory, ahead of LLM_PROVIDER / CODEGEN_PROVIDER /
 * ANTHROPIC_API_KEY, so flipping it on guarantees the live path is fully bypassed regardless
 * of what other provider env vars are set. Flipping it off restores normal behavior exactly —
 * no fixture code sits on the live path.
 */
export function isDemoMode(): boolean {
  return process.env.DEMO_MODE?.trim().toLowerCase() === "true";
}
