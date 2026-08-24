/**
 * Whether saving a round to Turso is offered in the UI.
 *
 * Off: the demo deployment has no `TURSO_DATABASE_URL` / `TURSO_AUTH_TOKEN` configured, so the
 * save path can only fail or no-op. A button that looks functional and quietly persists nothing is
 * worse than no button, so the control renders disabled with the reason stated rather than
 * inviting a click that cannot succeed.
 *
 * Everything behind it — persistApprovedRound, the rounds/projects API routes, round history — is
 * left fully wired. Configuring Turso and flipping this back to `true` is the entire re-enable
 * path, matching how THEME_SWITCHING_ENABLED gates the theme toggle (see lib/theme.ts).
 */
export const ROUND_PERSISTENCE_ENABLED = false;

/** Shown beside every disabled save control so the state reads as deliberate, not broken. */
export const ROUND_PERSISTENCE_DISABLED_REASON =
  "Saving is off in this demo — no round history database is connected.";
