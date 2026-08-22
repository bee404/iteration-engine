import { create } from "zustand";
import { persist } from "zustand/middleware";

import {
  DEFAULT_THEME,
  THEME_STORAGE_KEY,
  applyTheme,
  isTheme,
  nextTheme,
  type Theme,
} from "@/lib/theme";

interface ThemeState {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  /** Advances to the next theme in the cycle. The toggle is the only caller. */
  cycleTheme: () => void;
}

/**
 * The user's theme preference — the first persisted preference in the app, so it establishes the
 * pattern: zustand + the persist middleware writing to localStorage under a `coqui:` key.
 *
 * The store owns the DOM side effect rather than a component effect. A `useEffect` in the toggle
 * would leave the attribute stale for any other caller of `setTheme`, and would re-apply on every
 * mount; doing it in the setter (plus once on rehydration) means the attribute changes exactly
 * when the preference does.
 */
export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      theme: DEFAULT_THEME,
      setTheme: (theme) => {
        applyTheme(theme);
        set({ theme });
      },
      cycleTheme: () => get().setTheme(nextTheme(get().theme)),
    }),
    {
      name: THEME_STORAGE_KEY,
      onRehydrateStorage: () => (state, error) => {
        if (error) {
          // A corrupted or unreadable entry is recoverable — the app stays on the default theme —
          // but it is never silent, or the next reader of this code has no way to know it happened.
          console.warn("[theme] could not restore the saved theme preference", error);
          return;
        }
        // The pre-hydration script in the root layout has already set the attribute for the happy
        // path. Re-applying here covers the case where it could not run, and normalises a value
        // that was hand-edited in devtools to something outside the union.
        applyTheme(isTheme(state?.theme) ? state.theme : DEFAULT_THEME);
      },
    },
  ),
);

