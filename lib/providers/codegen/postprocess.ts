import { getColorAllowlist, getGeistFontFaceCss, GEIST_FONT_FAMILY } from "@/lib/design-systems";

/**
 * Deterministic post-processing for generated code — the part of the design-system
 * grounding that must NEVER depend on the model getting it right.
 *
 * The prompt (see claude-provider.ts + lib/design-systems) tells the model what to do;
 * this stage guarantees the parts that are unsafe to leave to model compliance:
 *
 *   1. Strip any markdown code fence the model wrapped the response in (manual fix #1).
 *   2. Reject and rewrite off-palette hex colors to the nearest allowlisted token,
 *      instead of trusting the model to only ever use the palette (manual fix #3).
 *   3. Guarantee the self-hosted Geist @font-face is present so the font actually loads
 *      rather than silently falling back to Arial (manual fix #2).
 *
 * It also emits non-blocking warnings for issues that can only be *fixed* by the model
 * (e.g. emoji used as icons — manual fix #5) so a regression is visible instead of silent.
 *
 * Every function here is pure and total: it takes source text in and returns source text
 * (plus warnings) out, with no I/O beyond reading the bundled design system. That makes the
 * whole stage trivially testable against the real Test 1 capture as a regression fixture.
 */

export interface PostProcessWarning {
  kind: "off_palette_color" | "emoji_icon";
  message: string;
}

export interface PostProcessResult {
  code: string;
  warnings: PostProcessWarning[];
}

/** Strips a single leading and/or trailing markdown code fence (```lang ... ```). */
export function stripCodeFences(raw: string): string {
  let code = raw.trim();
  // Leading ```lang or bare ``` on its own opening line.
  code = code.replace(/^```[\w-]*[ \t]*\r?\n/, "");
  // Trailing ``` on its own line or trailing the final token.
  code = code.replace(/\r?\n?```[ \t]*$/, "");
  return code.trim();
}

interface Rgb {
  r: number;
  g: number;
  b: number;
}

function expandHex(hex: string): string {
  const body = hex.slice(1).toLowerCase();
  if (body.length === 3) {
    return `#${body[0]}${body[0]}${body[1]}${body[1]}${body[2]}${body[2]}`;
  }
  return `#${body}`;
}

function hexToRgb(hex: string): Rgb {
  const body = expandHex(hex).slice(1);
  return {
    r: parseInt(body.slice(0, 2), 16),
    g: parseInt(body.slice(2, 4), 16),
    b: parseInt(body.slice(4, 6), 16),
  };
}

function nearestAllowedHex(hex: string, allowlist: ReadonlySet<string>): string {
  const target = hexToRgb(hex);
  let best = "";
  let bestDistance = Number.POSITIVE_INFINITY;
  for (const candidate of allowlist) {
    const rgb = hexToRgb(candidate);
    const distance =
      (rgb.r - target.r) ** 2 + (rgb.g - target.g) ** 2 + (rgb.b - target.b) ** 2;
    if (distance < bestDistance) {
      bestDistance = distance;
      best = candidate;
    }
  }
  return best;
}

/**
 * Rewrites every 3- or 6-digit hex literal that isn't on the allowlist to the nearest
 * allowlisted token, and reports each substitution. 8-digit (alpha) hexes are left alone
 * so we never silently drop an alpha channel. The allowlist itself is derived from the
 * active design system's tokens, so it can't drift from what the prompt advertised.
 */
export function enforceColorAllowlist(
  code: string,
  allowlist: ReadonlySet<string> = getColorAllowlist()
): { code: string; warnings: PostProcessWarning[] } {
  const warnings: PostProcessWarning[] = [];
  const seen = new Set<string>();

  const rewritten = code.replace(/#[0-9a-fA-F]{3}\b|#[0-9a-fA-F]{6}\b/g, (match) => {
    const normalized = expandHex(match);
    if (allowlist.has(normalized)) return match;

    const replacement = nearestAllowedHex(match, allowlist);
    const key = `${match}->${replacement}`;
    if (!seen.has(key)) {
      seen.add(key);
      warnings.push({
        kind: "off_palette_color",
        message: `Off-palette color ${match} rewritten to nearest allowlisted token ${replacement}.`,
      });
    }
    return replacement;
  });

  return { code: rewritten, warnings };
}

const FONT_INJECTOR_MARKER = "ie-ds-geist-font";

/**
 * Guarantees the self-hosted Geist @font-face is present in the generated component.
 *
 * Only injects when the code references the Geist family but defines no @font-face of its
 * own (idempotent — a component that already self-hosts the font is left untouched). The
 * injector is appended after the component so the readable component source stays at the
 * top; it runs on mount, is SSR-guarded, and de-dupes by id so multiple previews on one
 * page share a single style element.
 */
export function ensureFontFace(code: string): string {
  const referencesGeist = new RegExp(`['\"\`]${GEIST_FONT_FAMILY}\\b`).test(code);
  const alreadyHasFontFace = /@font-face/i.test(code);
  if (!referencesGeist || alreadyHasFontFace) return code;

  const fontFaceCss = getGeistFontFaceCss();
  const injector = [
    "",
    "",
    "/* --- Design-system pipeline: self-hosted Geist font (injected; do not edit) ---",
    "   Guarantees the Geist family actually loads instead of falling back to Arial. The",
    "   woff2 is inlined as a base64 data URI, so it renders in any sandbox with no network",
    "   dependency. Runs once on mount, SSR-guarded, de-duped by element id. */",
    `if (typeof document !== "undefined" && !document.getElementById(${JSON.stringify(FONT_INJECTOR_MARKER)})) {`,
    "  const ieGeistFontStyle = document.createElement(\"style\");",
    `  ieGeistFontStyle.id = ${JSON.stringify(FONT_INJECTOR_MARKER)};`,
    `  ieGeistFontStyle.textContent = ${JSON.stringify(fontFaceCss)};`,
    "  document.head.appendChild(ieGeistFontStyle);",
    "}",
    "",
  ].join("\n");

  return `${code}\n${injector}`;
}

// Emoji / pictographic ranges used as icons. Detection only — the fix is a prompt rule
// (the model must emit inline SVG line icons), but a warning makes a regression visible.
const EMOJI_PATTERN =
  /[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}\u{FE00}-\u{FE0F}\u{2190}-\u{21FF}\u{2300}-\u{23FF}]/u;

/** Flags emoji/glyph characters used where the icon policy requires inline SVG. */
export function detectEmojiIcons(code: string): PostProcessWarning[] {
  const found = new Set<string>();
  for (const char of code) {
    if (EMOJI_PATTERN.test(char)) found.add(char);
  }
  if (found.size === 0) return [];
  return [
    {
      kind: "emoji_icon",
      message:
        `Emoji/glyph characters used as icons (${[...found].join(" ")}) — the design system ` +
        "requires inline SVG line icons. Regenerate; the prompt now forbids emoji.",
    },
  ];
}

/**
 * Runs the full deterministic post-processing stage over one generation's raw output.
 * Order matters: fences are stripped first (so downstream regexes see real source), then
 * colors are normalized, then the font is guaranteed, and finally emoji are flagged.
 */
export function postProcessGeneratedCode(raw: string): PostProcessResult {
  const warnings: PostProcessWarning[] = [];

  let code = stripCodeFences(raw);

  const colorPass = enforceColorAllowlist(code);
  code = colorPass.code;
  warnings.push(...colorPass.warnings);

  code = ensureFontFace(code);

  warnings.push(...detectEmojiIcons(code));

  return { code, warnings };
}

