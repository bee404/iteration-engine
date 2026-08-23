"use client";

import { useSyncExternalStore } from "react";

import { DEFAULT_THEME, THEME_LABELS, nextTheme } from "@/lib/theme";
import { useThemeStore } from "@/lib/stores/theme";

/**
 * The theme switch: one button that swaps between Coquí's default light shell and the Obsidian53
 * (Pairing 2C) dark theme, showing a swatch of the theme it will switch you *to*.
 *
 * Hydration: the persisted preference only exists on the client, so the server snapshot is pinned
 * to DEFAULT_THEME and React adopts the real value on its first client render. useSyncExternalStore
 * is the primitive for exactly this — a mount effect flipping a `hasHydrated` flag would be a
 * cascading render, and reading the store directly would mismatch the server HTML. The user never
 * sees the wrong theme regardless: the document's colors are already set by THEME_INIT_SCRIPT
 * before first paint, and this only governs the button's own label.
 */
export function ThemeSwitch() {
  const cycleTheme = useThemeStore((state) => state.cycleTheme);
  const active = useSyncExternalStore(
    useThemeStore.subscribe,
    () => useThemeStore.getState().theme,
    () => DEFAULT_THEME,
  );

  const next = nextTheme(active);

  return (
    <button
      type="button"
      className="theme-switch"
      onClick={cycleTheme}
      title={`Switch to the ${THEME_LABELS[next]} theme`}
      aria-label={`Switch to the ${THEME_LABELS[next]} theme`}
    >
      <span className="theme-switch-swatch" data-target={next} aria-hidden="true" />
      {THEME_LABELS[next]}
    </button>
  );
}

