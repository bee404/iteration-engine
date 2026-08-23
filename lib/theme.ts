/**
 * The theme contract, shared by the persisted store, the toggle, and the pre-hydration script in
 * the root layout. All three have to agree on the storage key, the value shape, and the DOM
 * attribute; keeping them in one module is what makes the no-flash script safe to hand-write.
 */

/** `coqui` is the default: the gold-accent, dot-grid, light app shell. */
export const THEMES = ["coqui", "obsidian53"] as const;

export type Theme = (typeof THEMES)[number];

export const DEFAULT_THEME: Theme = "coqui";

/** Human labels for the toggle. Kept beside the union so adding a theme forces a label. */
export const THEME_LABELS: Record<Theme, string> = {
  coqui: "Coqu\u00ed",
  obsidian53: "Obsidian53",
};

export const THEME_STORAGE_KEY = "coqui:theme";

/**
 * The attribute the stylesheet keys off. Set on <html> rather than <body> so the token override
 * is in scope for everything, including portalled overlays.
 */
export const THEME_ATTRIBUTE = "data-theme";

export function isTheme(value: unknown): value is Theme {
  return typeof value === "string" && (THEMES as readonly string[]).includes(value);
}

/**
 * The theme the toggle advances to. Expressed as a total map rather than a modulo index into
 * THEMES: the compiler then proves every theme has a successor, and adding a third theme is a
 * type error here until its successor is declared.
 */
const SUCCESSOR: Record<Theme, Theme> = {
  coqui: "obsidian53",
  obsidian53: "coqui",
};

export function nextTheme(current: Theme): Theme {
  return SUCCESSOR[current];
}

/**
 * Applies the theme to the document. The default theme removes the attribute rather than writing
 * `data-theme="coqui"`, so `:root` alone is the default and there is exactly one way to be default.
 */
export function applyTheme(theme: Theme): void {
  const root = document.documentElement;
  if (theme === DEFAULT_THEME) {
    root.removeAttribute(THEME_ATTRIBUTE);
    return;
  }
  root.setAttribute(THEME_ATTRIBUTE, theme);
}

/**
 * Runs before first paint, ahead of React hydration, so a returning Obsidian53 user never sees a
 * frame of the light theme. It reads the same localStorage entry zustand's persist middleware
 * writes — hence the `{ state: { theme } }` envelope — and fails silently, because a blocked or
 * corrupted localStorage should cost the user the default theme, never a blank screen.
 */
export const THEME_INIT_SCRIPT = `(function(){try{var s=localStorage.getItem(${JSON.stringify(
  THEME_STORAGE_KEY,
)});if(!s)return;var t=JSON.parse(s).state.theme;if(t&&t!==${JSON.stringify(
  DEFAULT_THEME,
)}&&${JSON.stringify(THEMES)}.indexOf(t)>-1){document.documentElement.setAttribute(${JSON.stringify(
  THEME_ATTRIBUTE,
)},t);}}catch(e){}})();`;

