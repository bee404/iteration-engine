import type { ReactNode } from "react";

import { AppChrome } from "@/components/app-chrome";

/**
 * Route-group layout for every Coquí step screen. Rendering AppChrome here — above the per-route
 * `page.tsx` files — means the
 * gold border and dot-grid mount exactly once and persist across step navigation: React keeps
 * this subtree mounted while only `children` (the step content) swaps, so there's no
 * unmount/remount flash on route change. /workflow and the root redirect sit outside this group
 * and are unaffected.
 */
export default function AppShellLayout({ children }: { children: ReactNode }) {
  return (
    <AppChrome>
      {children}
    </AppChrome>
  );
}
