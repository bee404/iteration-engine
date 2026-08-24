import { formatDesignSystemForPrompt, getActiveDesignSystem } from "@/lib/design-systems";
import type { Direction } from "@/lib/types";
import { CodeGenGenerationError } from "./errors";
import { resolveScreenshotDataUrl, ScreenshotValidationError } from "@/lib/security/screenshot";
import { logSecurityEvent } from "@/lib/security/events";

/**
 * Model-agnostic prompt/validation logic shared by every real CodeGenProvider implementation
 * (ClaudeCodeGenProvider primary, OpenAICodeGenProvider fallback — see docs/decisions.md).
 * Only the streaming transport (Anthropic SSE event shape vs. OpenAI chat-completion chunk
 * shape) differs, and that stays in each provider's own file.
 */

/**
 * Resolves the browser-uploaded data URL without making a server-side network request.
 */
export function resolveScreenshot(screenshotRef: string) {
  try {
    return resolveScreenshotDataUrl(screenshotRef);
  } catch (error) {
    if (error instanceof ScreenshotValidationError) {
      logSecurityEvent("screenshot_rejected", { provider: "codegen" });
      throw new CodeGenGenerationError("invalid_screenshot", error.message);
    }
    throw error;
  }
}

export const SYSTEM_PROMPT =
  "You are a senior frontend engineer turning one chosen design direction into a working prototype. " +
  "Write a single, self-contained React functional component (TypeScript, inline styles or one " +
  "<style> block — no external UI library imports, no build step available) that a design tool can " +
  "render directly in a sandboxed preview. Output ONLY the raw source code: no markdown code fences, " +
  "no explanation before or after it.";

/**
 * Enforceable implementation rules the model must follow, appended after the design-system
 * grounding. These are the fixes that a clearer instruction can reliably produce (the
 * deterministic guarantees — fence stripping, off-palette color rewriting, font injection —
 * live in postprocess.ts instead, because they must not depend on model compliance). Each
 * bullet maps to one of the nine issues the raw Test 1 capture needed hand-fixed.
 */
export const IMPLEMENTATION_REQUIREMENTS = [
  "Implementation requirements (these are not style suggestions — treat them as acceptance criteria):",
  "",
  "- Component mapping: render the primary action as the ink-filled primary button and every " +
    "secondary/tertiary action as the ghost-button spec (white fill, 1px hairline border, 6px " +
    "radius). Never render a secondary action as a bare underlined text link.",
  "- Icons: use inline SVG line icons only (~1.5px stroke, fill=\"none\", rounded caps, ink/mute " +
    "grey). Do NOT use emoji or icon-font glyphs anywhere.",
  "- Real interactivity: wire actual React state (useState) and handlers so the prototype " +
    "functions — e.g. completing a step updates state and advances the flow. Do not fake " +
    "interactivity with static markup or no-op handlers.",
  "- Emphasis isolation: when one item is 'the next action', emphasize exactly that single item " +
    "(e.g. compute the first incomplete, unlocked step once and highlight only it). Never apply " +
    "the emphasized treatment to every eligible item at once.",
  "- Sequential numbering: when rendering an ordered set of steps, show explicit 1-based step " +
    "numbers (and/or an 'Step N of M' label) so order is unambiguous.",
  "- Responsive: include real responsive rules for narrow viewports (a <style> block with media " +
    "queries, or equivalent) so the layout stays usable on small screens — do not assume a fixed " +
    "wide desktop width.",
  "- Fonts: reference the design system's self-hosted font family by name; the pipeline guarantees " +
    "the @font-face is loaded, so you do not need to embed font bytes yourself.",
  "- Output raw source only: no markdown code fences, no prose before or after the component. " +
    "The response must be a single valid TSX file that parses on its own — the very first " +
    "character is the first line of code and the very last is the final `}`.",
  "- Syntax that must parse: this code is transpiled and mounted live, so it has to be " +
    "syntactically valid TSX. In inline style objects, every CSS value that carries a unit must " +
    "be a quoted string (`padding: '24px'`, `maxWidth: '480px'`) — never a bare `24px`; only " +
    "unitless numbers may be unquoted (`opacity: 1`, `zIndex: 10`, `lineHeight: 1.5`). If you " +
    "use a `<style>` block, put its CSS inside a template-literal child " +
    "(`` <style>{`.card { color: ... }`}</style> ``), never as raw text between the tags.",
  "- Valid JSX children (the transpiler rejects these and the component won't mount): never put " +
    "a bare object literal in child position \u2014 `<div>{count: 5}</div>` or `<span>{label: value}</span>` " +
    "is NOT a valid child and fails with 'Unexpected token when processing JSX children'. To show a " +
    "computed value, use an expression that evaluates to a string or number " +
    "(`<div>{`Total: ${total}`}</div>` or `<div>{formatPrice(total)}</div>`); to apply inline " +
    "styles, use the double-brace attribute form (`style={{ color: 'red' }}`), never a child. " +
    "Any literal `<` or `>` inside visible text must be escaped or wrapped in an expression " +
    "(`Total {'<'} $50`, `&lt;`, `&gt;`, or `{'> 90% match'}`) \u2014 a bare `Total < $50` or `> 90%` " +
    "in JSX text is a parse error.",
].join("\n");

/**
 * NOTE (scope gap, tracked but not fully closed by this change): generation is now grounded
 * in a design system (lib/design-systems), but there is still exactly one system, hardcoded
 * via getActiveDesignSystem() — not one selected per project/round. docs/blueprint.md and
 * docs/decisions.md describe a planned W3C DTCG token index + condensed style guide as part
 * of the round input model, but lib/types.ts's Round/Project/Direction shapes carry no
 * per-project design-system reference field yet. Building that selection (or a config UI) is
 * out of scope here; this is a proof-of-concept that grounding changes the output at all, with
 * lib/design-systems structured so a different system can replace this one without touching
 * buildPrompt below.
 */
export function buildPrompt(direction: Direction, designGoal: string): string {
  const lines = [
    `Design goal: ${designGoal}`,
    "",
    `Direction to implement: ${direction.title}`,
    `Rationale: ${direction.rationale}`,
    `Tradeoffs: ${direction.tradeoffs}`,
    "",
    "Suggested changes this direction calls for:",
    ...direction.suggestedChanges.map((change) => `- ${change}`),
  ];

  if (direction.patternReference) {
    lines.push(
      "",
      `Ground the structure/pattern in: ${direction.patternReference.name} (${direction.patternReference.source}) — ${direction.patternReference.description}`
    );
  }

  lines.push(
    "",
    "The attached screenshot is the current UI this direction iterates on. Generate a component that " +
      "applies the suggested changes above to what's actually visible in the screenshot, in service of " +
      "the stated design goal and rationale — not a generic template. Reference real elements from the " +
      "screenshot (labels, layout regions, existing components) rather than inventing unrelated content."
  );

  lines.push(
    "",
    "---",
    "",
    "Apply the following design system to every element you generate: colors, type scale, spacing, " +
      "border radius, and named component shapes all come from here, not from your own defaults or " +
      "invented values. Where a Do/Don't below conflicts with something generic you'd otherwise reach " +
      "for, follow the Do/Don't.",
    "",
    formatDesignSystemForPrompt(getActiveDesignSystem())
  );

  lines.push("", "---", "", IMPLEMENTATION_REQUIREMENTS);

  return lines.join("\n");
}
