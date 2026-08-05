import type { DesignSystem } from "./types";

/**
 * Renders a DesignSystem as a condensed style-guide section for the codegen prompt.
 * Kept separate from any concrete DesignSystem so lib/providers/codegen/claude-provider.ts
 * never has to change when the active system (see index.ts) is swapped for a different one.
 */
export function formatDesignSystemForPrompt(system: DesignSystem): string {
  const colorLines = system.colors.map((c) => `- ${c.token}: ${c.value} — ${c.usage}`);

  const typeLines = system.typography.map(
    (t) =>
      `- ${t.token}: ${t.fontFamily}, ${t.fontSize}/${t.lineHeight}, weight ${t.fontWeight}, ` +
      `letter-spacing ${t.letterSpacing} — ${t.usage}`
  );

  const spacingLine = system.spacing.map((s) => `${s.token}=${s.value}`).join(", ");
  const radiusLines = system.radii.map((r) => `- ${r.token}: ${r.value} — ${r.usage}`);
  const componentLines = system.components.map((c) => `- ${c.name}: ${c.spec}`);

  return [
    `Design system: ${system.name}`,
    system.description,
    "",
    "Colors (use these values and roles exactly — do not invent other hex values):",
    ...colorLines,
    "",
    "Typography scale (match family, size, weight, and letter-spacing per role):",
    ...typeLines,
    "",
    `Spacing scale (px): ${spacingLine}`,
    "",
    "Border radius scale (use the radius matching each element's role below):",
    ...radiusLines,
    "",
    "Named component specs (match shape/color/type/radius per component role):",
    ...componentLines,
    "",
    "Do:",
    ...system.dos.map((line) => `- ${line}`),
    "",
    "Don't:",
    ...system.donts.map((line) => `- ${line}`),
  ].join("\n");
}

