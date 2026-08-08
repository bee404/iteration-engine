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

  const fontLines = system.fonts.map((f) => {
    const loading =
      f.loading === "selfHostedInline"
        ? "self-hosted @font-face injected by the pipeline — reference this family directly, it will render"
        : "system/fallback stack — assume available";
    return `- ${f.family}: ${f.usage} (${loading})`;
  });

  const allowedHexes = system.colors.map((c) => c.value.toLowerCase()).join(", ");

  return [
    `Design system: ${system.name}`,
    system.description,
    "",
    "Colors — this is a CLOSED ALLOWLIST. Use these hex values and roles exactly. Do not invent, " +
      "tint, or approximate any other hex; if the shade you want is not listed, pick the nearest " +
      "token below. The codegen pipeline rejects and rewrites off-palette hex values after generation.",
    ...colorLines,
    `Allowed hex values (nothing else): ${allowedHexes}.`,
    "",
    "Fonts (match family to role):",
    ...fontLines,
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
    "Iconography:",
    system.iconography,
    "",
    "Do:",
    ...system.dos.map((line) => `- ${line}`),
    "",
    "Don't:",
    ...system.donts.map((line) => `- ${line}`),
  ].join("\n");
}

