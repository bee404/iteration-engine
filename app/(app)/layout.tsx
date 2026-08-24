import type { ReactNode } from "react";

import { AppChrome } from "@/components/app-chrome";
import { ChainViewportHydrator } from "@/components/chain-viewport-hydrator";
import { isDemoMode } from "@/lib/demo-mode";

/**
 * Route-group layout for every Coquí step screen (/upload, /feedback, /directions,
 * /synthesized). Rendering AppChrome here — above the per-route `page.tsx` files — means the
 * gold border and dot-grid mount exactly once and persist across step navigation: React keeps
 * this subtree mounted while only `children` (the step content) swaps, so there's no
 * unmount/remount flash on route change. /workflow and the root redirect sit outside this group
 * and are unaffected.
 */
export default function AppShellLayout({ children }: { children: ReactNode }) {
  return (
    <AppChrome>
      {/* Reads the chain's committed viewport box back out of the persisted round, so a hard
          reload mid-chain restores the lock instead of re-opening the box. */}
      <ChainViewportHydrator persistenceEnabled={!isDemoMode()} />
      {children}
    </AppChrome>
  );
}

