/**
 * Structured shape for a design system reference that can ground code generation.
 * lib/providers/codegen/claude-provider.ts's prompt-building code only ever reads through
 * this interface, never a concrete system's fields directly, so swapping which design
 * system grounds generation (see lib/design-systems/index.ts) never requires touching the
 * prompt logic itself — only supplying a new DesignSystem value.
 */

export interface DesignSystemColor {
  token: string;
  value: string;
  /** Where/how this color is used, so the model applies it in the right role, not just the right hex. */
  usage: string;
}

export interface DesignSystemTypeStyle {
  token: string;
  fontFamily: string;
  fontSize: string;
  fontWeight: number;
  lineHeight: string;
  letterSpacing: string;
  usage: string;
}

export interface DesignSystemSpacing {
  token: string;
  value: string;
}

export interface DesignSystemRadius {
  token: string;
  value: string;
  usage: string;
}

export interface DesignSystemComponent {
  name: string;
  /** Condensed spec: background/text/border/typography/radius/padding and context, in prose. */
  spec: string;
}

export interface DesignSystemFont {
  /** The font-family name generated code must reference (e.g. "Geist"). */
  family: string;
  /** Which type roles this family carries, so the model applies it in the right place. */
  usage: string;
  /**
   * How the family is made available. The codegen pipeline injects a self-hosted
   * @font-face for `selfHostedInline` families deterministically (see
   * lib/design-systems/geist-font.ts + lib/providers/codegen/postprocess.ts) rather
   * than trusting the model — or the render host — to have the font installed. A
   * `systemFallback` family is a plain stack the model may assume is present.
   */
  loading: "selfHostedInline" | "systemFallback";
}

/**
 * A condensed, prompt-agnostic design system reference — colors, type scale, spacing,
 * radii, named component specs, and explicit do's/don'ts. Any design system doc (Vercel's
 * Geist today, a different client style guide tomorrow) is expressed as one of these; the
 * codegen prompt builder formats whichever DesignSystem is active without caring which one.
 */
export interface DesignSystem {
  id: string;
  name: string;
  /** One-paragraph description of the system's overall visual language. */
  description: string;
  colors: DesignSystemColor[];
  typography: DesignSystemTypeStyle[];
  spacing: DesignSystemSpacing[];
  radii: DesignSystemRadius[];
  components: DesignSystemComponent[];
  /** Fonts the system uses and how each is loaded (see DesignSystemFont.loading). */
  fonts: DesignSystemFont[];
  /**
   * Icon policy in prose — what iconography is allowed (e.g. inline SVG line icons)
   * and what is banned (e.g. emoji). Kept explicit so the codegen prompt can enforce
   * it rather than leaving icon style to the model's defaults.
   */
  iconography: string;
  dos: string[];
  donts: string[];
}

