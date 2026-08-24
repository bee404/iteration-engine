import type { ReactNode } from "react";

import { ThemeSwitch } from "@/components/theme-switch";
import { THEME_SWITCHING_ENABLED } from "@/lib/theme";

/**
 * The persistent outer chrome for the whole Coquí app (Figma node 132:3296, "Outer chrome"):
 * the gold border, its inner shadow, and the dot-grid ground. Rendered once by the (app) route
 * group's layout, so it never unmounts across step navigation — eliminating the white flash on
 * route transitions — and is pinned to the viewport (position:fixed in CSS), so it can never be
 * pushed out of view by in-page content growth. Every screen renders into `.app-chrome-content`,
 * the one thing that scrolls or resizes; the frame around it is static decoration.
 */
export function AppChrome({ children }: { children: ReactNode }) {
  return (
    <div className="app-chrome">
      <div className="app-chrome-dot-grid" aria-hidden="true" />
      <div className="app-chrome-content">{children}</div>
      {/* The step header is currently hidden pending redesign, so the theme switch lives on the
          chrome itself: rendered once here, it persists across step navigation like the frame.
          THEME_SWITCHING_ENABLED is off while Obsidian53 is the sole brand direction, so this
          renders nothing for now — flipping that flag back on is what brings the toggle back. */}
      {THEME_SWITCHING_ENABLED && <ThemeSwitch />}
    </div>
  );
}

