import type { DesignSystem } from "./types";
import { vercelGeistDesignSystem } from "./vercel-geist";

export type {
  DesignSystem,
  DesignSystemColor,
  DesignSystemComponent,
  DesignSystemRadius,
  DesignSystemSpacing,
  DesignSystemTypeStyle,
} from "./types";
export { formatDesignSystemForPrompt } from "./format";

/**
 * PROOF-OF-CONCEPT SCOPE: returns one hardcoded design system for every codegen request,
 * proving that grounding generation in a real style guide changes its output. There is no
 * per-project or per-round selection here — lib/types.ts's Round/Project shapes carry no
 * design-system/token reference field yet (docs/decisions.md tracks a planned W3C DTCG
 * token index + condensed style guide as part of the input model, not yet built). Adding
 * that selection is future scope: a config UI or a per-project field, not this function.
 * When it lands, this function becomes a lookup keyed by project/round instead of a
 * constant, and nothing else in lib/providers/codegen needs to change.
 */
export function getActiveDesignSystem(): DesignSystem {
  return vercelGeistDesignSystem;
}

