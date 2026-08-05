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
  dos: string[];
  donts: string[];
}

