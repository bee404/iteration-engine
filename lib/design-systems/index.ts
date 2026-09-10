import type { DesignSystem } from "./types";
import { vercelGeistDesignSystem } from "./vercel-geist";

const DESIGN_SYSTEMS = new Map<string, DesignSystem>([
  [vercelGeistDesignSystem.id, vercelGeistDesignSystem],
]);

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
 * generated output as off-palette. Derived from the explicitly selected system's color tokens
 * so it cannot drift from what that request's prompt advertises.
 */
export function getColorAllowlist(system: DesignSystem): ReadonlySet<string> {
  return new Set(system.colors.map((color) => color.value.toLowerCase()));
}

/**
 * Resolve an explicitly selected design system. Source-preserving generation deliberately
 * calls neither this function nor the deterministic palette/font enforcement passes.
 */
export function getDesignSystemById(id: string): DesignSystem | null {
  return DESIGN_SYSTEMS.get(id) ?? null;
}
