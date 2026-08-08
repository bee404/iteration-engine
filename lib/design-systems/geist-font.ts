import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * Self-hosted Geist Sans, made available to generated prototypes without any external
 * network dependency.
 *
 * The original captured codegen output set `fontFamily: 'Geist, ...'` but nothing ever
 * loaded Geist, so previews silently fell back to Arial (manual fix #2). The font can't be
 * left to the model — it has no way to ship font bytes — nor to the render host, which may
 * not have Geist installed. So the pipeline injects a real @font-face whose src is the
 * woff2 inlined as a base64 data: URI: it renders in any sandbox, offline, every time.
 *
 * The woff2 (Vercel's published Geist variable font) is bundled at
 * lib/design-systems/assets/Geist-Variable.woff2. Reading + base64-encoding it is done once
 * and memoized; the API route runs on the Node runtime, so fs access is available.
 */

export const GEIST_FONT_FAMILY = "Geist";

const FONT_ASSET_PATH = join(process.cwd(), "lib", "design-systems", "assets", "Geist-Variable.woff2");

let cachedFontFaceCss: string | null = null;

/**
 * Returns a `@font-face` rule for Geist with the woff2 inlined as a base64 data URI.
 * Declares the full variable weight axis (100–900) and `font-display: swap`. Memoized:
 * the ~70KB file is read and encoded only on first call.
 */
export function getGeistFontFaceCss(): string {
  if (cachedFontFaceCss !== null) return cachedFontFaceCss;

  const base64 = readFileSync(FONT_ASSET_PATH).toString("base64");
  cachedFontFaceCss =
    `@font-face {\n` +
    `  font-family: '${GEIST_FONT_FAMILY}';\n` +
    `  src: url(data:font/woff2;base64,${base64}) format('woff2');\n` +
    `  font-weight: 100 900;\n` +
    `  font-style: normal;\n` +
    `  font-display: swap;\n` +
    `}`;
  return cachedFontFaceCss;
}

