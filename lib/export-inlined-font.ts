/**
 * Un-inlines the design-system font from generated component source, for export only.
 *
 * The codegen post-processor (lib/providers/codegen/postprocess.ts `ensureFontFace`) appends
 * a style-injector block whose `@font-face` src is the Geist woff2 as a base64 data URI.
 * That is the right shape for the live preview — the iframe `srcDoc` has to be entirely
 * self-contained with no network — but it makes the exported `src/<Component>.tsx` ~103KB of
 * unreadable base64, which defeats the purpose of shipping *source*.
 *
 * So the export path (and only the export path) reverses it: the block is removed from the
 * component, the base64 payload is decoded back into a real woff2 file, and the original
 * `@font-face` rule is re-emitted as a plain stylesheet pointing at that file. The exported
 * project therefore renders in exactly the same typeface, still offline, with the component
 * back down to a few KB. The preview path is deliberately left untouched.
 */

/** Matches the whole injector block appended by `ensureFontFace`, comment header included. */
const INJECTOR_BLOCK =
  /\n*\/\*\s*---\s*Design-system pipeline: self-hosted [^\n]*font[\s\S]*?document\.head\.appendChild\(ieGeistFontStyle\);\s*\}\n?/;

/** The JSON string literal assigned to the injected `<style>`'s textContent. */
const CSS_ASSIGNMENT = /ieGeistFontStyle\.textContent\s*=\s*("(?:[^"\\]|\\.)*")\s*;/;

/**
 * `url(data:font/woff2;base64,AAAA) format('woff2')` inside that CSS. Quotes around the URL
 * are optional, and the trailing `format()` hint is swallowed so the rewrite replaces the
 * whole src value rather than leaving a duplicate format behind it.
 */
const FONT_DATA_URI =
  /url\(\s*["']?data:font\/([a-z0-9+.-]+);base64,([A-Za-z0-9+/=]+)["']?\s*\)(?:\s*format\(\s*["'][^"')]*["']\s*\))?/i;

const FONT_FAMILY_DECLARATION = /font-family:\s*['"]?([^'";]+)['"]?\s*;/;

export interface ExtractedFontAsset {
  /** Path inside the exported project, relative to the zip root. */
  path: string;
  bytes: Uint8Array<ArrayBuffer>;
}

export interface ExtractedStylesheet {
  path: string;
  contents: string;
}

export interface InlinedFontExtraction {
  /** Component source with the injected data-URI block removed (unchanged if none found). */
  code: string;
  /** Null when the source carried no extractable inlined font. */
  asset: ExtractedFontAsset | null;
  /** Null when there is no asset; otherwise the stylesheet that re-declares the font. */
  stylesheet: ExtractedStylesheet | null;
}

function slugifyFamily(family: string): string {
  const slug = family
    .trim()
    .replace(/[^A-Za-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug || "font";
}

function decodeBase64(value: string): Uint8Array<ArrayBuffer> {
  const binary = atob(value);
  const bytes = new Uint8Array(new ArrayBuffer(binary.length));
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}

/**
 * Parses the injected `<style>` payload back into real CSS. The injector builds it with
 * `JSON.stringify`, so the literal is always valid JSON — a parse failure means the block
 * is not the one we know how to rewrite, and the caller must leave the source alone rather
 * than half-strip it.
 */
function readInjectedCss(block: string): string | null {
  const literal = CSS_ASSIGNMENT.exec(block)?.[1];
  if (literal === undefined) return null;
  try {
    const parsed: unknown = JSON.parse(literal);
    return typeof parsed === "string" ? parsed : null;
  } catch {
    return null;
  }
}

/**
 * Removes the inlined-font injector from `code` and returns the font as separate files.
 *
 * Conservative by design: if the block is absent, or its payload cannot be decoded into a
 * font asset, the code is returned verbatim and no files are emitted. A partially stripped
 * component would silently lose its typeface, which is worse than a large file.
 */
export function extractInlinedFont(code: string, stylesheetPath = "src/fonts.css"): InlinedFontExtraction {
  const untouched: InlinedFontExtraction = { code, asset: null, stylesheet: null };

  const blockMatch = INJECTOR_BLOCK.exec(code);
  if (!blockMatch) return untouched;

  const css = readInjectedCss(blockMatch[0]);
  if (css === null) return untouched;

  const dataUri = FONT_DATA_URI.exec(css);
  if (!dataUri) return untouched;

  const [, format, base64] = dataUri;
  if (format === undefined || base64 === undefined) return untouched;

  const family = FONT_FAMILY_DECLARATION.exec(css)?.[1]?.trim() ?? "font";
  const fileName = `${slugifyFamily(family)}.${format}`;

  let bytes: Uint8Array<ArrayBuffer>;
  try {
    bytes = decodeBase64(base64);
  } catch {
    return untouched;
  }
  if (bytes.length === 0) return untouched;

  // Rewrite only the src URL so every other descriptor (weight axis, font-display, style)
  // survives exactly as the pipeline declared it.
  const rewrittenCss = css.replace(dataUri[0], `url("./assets/${fileName}") format("${format}")`);

  const stylesheetDirectory = stylesheetPath.replace(/[^/]+$/, "");

  return {
    code: `${code.replace(INJECTOR_BLOCK, "\n").replace(/\s+$/, "")}\n`,
    asset: { path: `${stylesheetDirectory}assets/${fileName}`, bytes },
    stylesheet: {
      path: stylesheetPath,
      contents:
        `/* Extracted from the generated component at export time. Coquí's preview inlines this\n` +
        `   font as a base64 data URI so the sandboxed iframe is self-contained; the exported\n` +
        `   project ships it as a real asset instead, so the component source stays readable. */\n` +
        `${rewrittenCss}\n`,
    },
  };
}
