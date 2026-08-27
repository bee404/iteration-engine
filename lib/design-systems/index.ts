import type { DesignSystem } from "./types";
import { vercelGeistDesignSystem } from "./vercel-geist";

export type {
  DesignSystem,
  DesignSystemColor,
  DesignSystemComponent,
  DesignSystemFont,
  DesignSystemRadius,
  DesignSystemSpacing,
  DesignSystemTypeStyle,
} from "./types";
export { formatDesignSystemForPrompt } from "./format";
export { getGeistFontFaceCss, GEIST_FONT_FAMILY } from "./geist-font";

/**
 * The closed set of hex values this system allows, lower-cased. The codegen
 * post-processor (lib/providers/codegen/postprocess.ts) treats any other hex in
 * generated output as off-palette. Derived from the active system's color tokens so
 * it can never drift from what the prompt advertises.
 */
export function getColorAllowlist(system: DesignSystem = getActiveDesignSystem()): ReadonlySet<string> {
  return new Set(system.colors.map((color) => color.value.toLowerCase()));
}

/**
 * PROOF-OF-CONCEPT SCOPE: returns one hardcoded design system for every codegen request,
 * proving that grounding generation in a real style guide changes its output. There is no
 * per-exploration selection here — the active transient state carries no
 * design-system/token reference field yet (docs/decisions.md tracks a planned W3C DTCG
 * token index + condensed style guide as part of the input model, not yet built). Adding
 * that selection is future scope: a config UI or a per-project field, not this function.
 * When it lands, this function becomes a lookup keyed by project/round instead of a
 * constant, and nothing else in lib/providers/codegen needs to change.
 */
export function getActiveDesignSystem(): DesignSystem {
  return vercelGeistDesignSystem;
}
