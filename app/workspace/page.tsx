import { RoundWorkspace } from "@/components/round-workspace";

/**
 * The single-page round workspace: intake → critique → directions → per-direction code
 * generation → approval.
 *
 * This screen has been maintained but unrouted since the stepped Coquí flow took over `/`
 * (#20), which left the code-generation path — and with it the Source/Iteration comparison in
 * the code sheet — unreachable in the running app. Remounting it here restores a way to reach
 * and review that path. It deliberately sits outside the `(app)` route group: the stepped
 * chrome in that group's layout assumes one step per screen, and this workspace is the whole
 * round on one page.
 */
export default function WorkspacePage() {
  return <RoundWorkspace />;
}

