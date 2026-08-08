import type { DesignSystem } from "./types";

/**
 * Vercel's Geist system, condensed from the project's design-system reference doc
 * (DESIGN-vercel.md / Obvious artifact art_xs7o1rCz): a stark black-on-near-white
 * developer-platform aesthetic where one ink tone carries every heading, CTA, and border,
 * and color is confined to a hero mesh gradient. This is the first (and, for this
 * proof-of-concept, only) concrete DesignSystem — see index.ts for why it's wired in as a
 * single hardcoded system rather than something selectable per project/round.
 */
export const vercelGeistDesignSystem: DesignSystem = {
  id: "vercel-geist",
  name: "Vercel Geist",
  description:
    "A black-and-white duet: near-black ink (#171717) on a near-white canvas (#fafafa) " +
    "carries every heading, body copy, primary button, and border. The only color the page " +
    "allows itself is a multi-stop mesh gradient (cyan/blue/violet/magenta/amber) confined to " +
    "the hero — everywhere else is restraint. Geist Sans sets tightly-tracked display type; " +
    "Geist Mono labels small uppercase technical eyebrows. Depth comes from a 1px hairline " +
    "border before any shadow, never heavy elevation.",
  colors: [
    { token: "ink", value: "#171717", usage: "headings, body-strong text, primary button fill, borders' darkest tier" },
    { token: "on-ink", value: "#ffffff", usage: "text/icon color on top of ink-filled surfaces (e.g. primary button label)" },
    { token: "body", value: "#4d4d4d", usage: "standard paragraph and secondary copy, nav links — never pure black" },
    { token: "mute", value: "#8f8f8f", usage: "lower-emphasis captions and metadata" },
    { token: "faint", value: "#a1a1a1", usage: "placeholders, disabled labels — the lowest text tier" },
    { token: "canvas", value: "#fafafa", usage: "default page/section background" },
    { token: "canvas-elevated", value: "#ffffff", usage: "cards, buttons, inputs, code blocks lifted off the canvas" },
    { token: "hairline", value: "#ebebeb", usage: "the 1px border on every card, input, and divider — the structural workhorse" },
    { token: "hairline-soft", value: "#f2f2f2", usage: "faint fill for subtle alternating panels/inset wells" },
    { token: "link", value: "#0070f3", usage: "inline links, focus states, and the positive/active signal" },
    { token: "violet", value: "#7928ca", usage: "illustration accent / mesh-gradient stop only, never a chrome fill" },
    { token: "cyan", value: "#50e3c2", usage: "illustration accent / mesh-gradient stop only, never a chrome fill" },
    { token: "pink", value: "#ff0080", usage: "illustration accent / mesh-gradient stop only, never a chrome fill" },
    { token: "error", value: "#ee0000", usage: "validation / destructive states" },
    { token: "warning", value: "#f5a623", usage: "caution states" },
  ],
  typography: [
    { token: "display-xl", fontFamily: "Geist, Arial, sans-serif", fontSize: "48px", fontWeight: 600, lineHeight: "48px", letterSpacing: "-2.4px", usage: "hero headline" },
    { token: "heading-lg", fontFamily: "Geist, Arial, sans-serif", fontSize: "32px", fontWeight: 600, lineHeight: "40px", letterSpacing: "-1.28px", usage: "major section headings" },
    { token: "heading-md", fontFamily: "Geist, Arial, sans-serif", fontSize: "20px", fontWeight: 600, lineHeight: "28px", letterSpacing: "-0.4px", usage: "sub-section / card headings" },
    { token: "label-sm", fontFamily: "Geist, Arial, sans-serif", fontSize: "14px", fontWeight: 500, lineHeight: "20px", letterSpacing: "-0.28px", usage: "strong labels, nav emphasis" },
    { token: "mono-eyebrow", fontFamily: "Geist Mono, ui-monospace, SFMono-Regular, Menlo, monospace", fontSize: "12px", fontWeight: 500, lineHeight: "16px", letterSpacing: "0", usage: "uppercase section eyebrows — the only other role for Geist Mono besides code" },
    { token: "body-lg", fontFamily: "Geist, Arial, sans-serif", fontSize: "16px", fontWeight: 400, lineHeight: "24px", letterSpacing: "0", usage: "lead paragraphs, large body" },
    { token: "body-md", fontFamily: "Geist, Arial, sans-serif", fontSize: "14px", fontWeight: 400, lineHeight: "20px", letterSpacing: "0", usage: "default body, nav links, table cells" },
    { token: "body-sm", fontFamily: "Geist, Arial, sans-serif", fontSize: "12px", fontWeight: 400, lineHeight: "16px", letterSpacing: "0", usage: "captions, footnotes, metadata" },
    { token: "button-lg", fontFamily: "Geist, Arial, sans-serif", fontSize: "16px", fontWeight: 500, lineHeight: "20px", letterSpacing: "0", usage: "marketing pill button labels" },
    { token: "button-md", fontFamily: "Geist, Arial, sans-serif", fontSize: "14px", fontWeight: 500, lineHeight: "20px", letterSpacing: "0", usage: "nav / app button labels" },
    { token: "code", fontFamily: "Geist Mono, ui-monospace, SFMono-Regular, Menlo, monospace", fontSize: "14px", fontWeight: 400, lineHeight: "20px", letterSpacing: "0", usage: "code blocks, inline code" },
  ],
  spacing: [
    { token: "xxs", value: "4px" },
    { token: "xs", value: "8px" },
    { token: "sm", value: "12px" },
    { token: "md", value: "16px" },
    { token: "lg", value: "24px" },
    { token: "xl", value: "32px" },
    { token: "2xl", value: "40px" },
    { token: "3xl", value: "64px" },
    { token: "4xl", value: "96px" },
    { token: "section", value: "128px" },
  ],
  radii: [
    { token: "none", value: "0px", usage: "full-bleed bands, dividers" },
    { token: "sm", value: "6px", usage: "nav/app buttons and inputs — tight square, functional chrome" },
    { token: "md", value: "12px", usage: "feature cards, code blocks" },
    { token: "lg", value: "16px", usage: "pricing cards, larger panels" },
    { token: "pill-category", value: "64px", usage: "category-tab pills" },
    { token: "pill", value: "100px", usage: "marketing CTA pills — fully rounded" },
    { token: "full", value: "9999px", usage: "circular icon buttons, avatars" },
  ],
  components: [
    {
      name: "button-primary (marketing CTA)",
      spec:
        "Background ink (#171717), text white, button-lg type, fully rounded pill (100px radius), " +
        "horizontal-only padding (0 14px). Used for marketing CTAs like \"Deploy\" or \"Get Started\" — never for nav/app chrome.",
    },
    {
      name: "button-primary-sm (nav / in-app CTA)",
      spec:
        "Background ink (#171717), text white, button-md type, tight square radius (6px), horizontal-only " +
        "padding (0 6px). Used for nav/in-app actions like \"Sign Up\" — never a rounded pill. Do not mix this " +
        "shape with button-primary within the same context.",
    },
    {
      name: "button-ghost-sm (nav / in-app secondary)",
      spec:
        "Background white, ink text, 1px hairline border, button-md type, 6px square radius, horizontal-only " +
        "padding (0 6px). Used for secondary nav/app actions like \"Log In\".",
    },
    {
      name: "text-input",
      spec: "Background white, ink text, 1px hairline border, body-md type, 6px radius, padding 8px 12px.",
    },
    {
      name: "feature-card",
      spec:
        "Background white on the canvas, 1px hairline border (no shadow by default), ink text, body-md type, " +
        "12px radius, 24px padding. Depth is the border, not elevation.",
    },
    {
      name: "pricing-card / larger panel",
      spec: "Background white, 1px hairline border, ink text, body-md type, 16px radius, 32px padding.",
    },
    {
      name: "code-block",
      spec: "Background white, ink text in Geist Mono (code type), 1px hairline border, 12px radius, 16px padding.",
    },
  ],
  fonts: [
    {
      family: "Geist",
      usage: "every heading, body, label, and button — the primary sans for all UI text",
      loading: "selfHostedInline",
    },
    {
      family: "Geist Mono",
      usage: "code blocks and small uppercase section eyebrows only",
      loading: "systemFallback",
    },
  ],
  iconography:
    "Icons are inline SVG line icons only: ~1.5px stroke, no fill (fill=\"none\"), rounded " +
    "linecaps/joins, drawn in the ink/mute grey range — never accent-colored. Do NOT use emoji " +
    "characters (❄️🔧☁️⚛️ etc.) or icon-font glyphs as icons; they read as decoration, not chrome, " +
    "and break the restrained black-on-white language. Prefer a single 24x24 viewBox sized down.",
  dos: [
    "Keep the page canvas near-white (#fafafa) and let near-black ink (#171717) carry headings, CTAs, and borders — this is a black-and-white duet.",
    "Use every color from the token list above verbatim and treat it as a closed allowlist — if a shade you want is not a listed token, pick the nearest listed token instead of inventing a new hex.",
    "Render secondary/tertiary actions as the button-ghost-sm spec (white fill, 1px hairline border, 6px radius) — a real bordered button, never a bare underlined text link.",
    "Draw all icons as inline SVG line icons (see the icon policy above); never reach for emoji or glyph fonts.",
    "Confine color to a hero mesh gradient and small illustration accents; reserve the link blue (#0070f3) for links/focus only.",
    "Use the two button shapes strictly by context: a fully-rounded black pill for marketing CTAs, a tight 6px square for nav/app controls.",
    "Define cards and inputs with a 1px hairline border (#ebebeb) before reaching for any shadow — flat is the default.",
    "Set display headings in a 600-weight sans with tight negative letter-spacing; reserve the monospace face for code and small uppercase section eyebrows.",
    "Step body text through the grey ladder deliberately (ink → body → mute → faint) rather than using one grey everywhere.",
  ],
  donts: [
    "Don't invent hex values outside the color token list — it is a closed allowlist; the codegen pipeline rejects and rewrites any off-palette hex, so use the tokens directly.",
    "Don't use emoji or icon-font glyphs as icons — icons are inline SVG line icons only.",
    "Don't render a secondary action as a bare underlined text link — use the ghost-button spec.",
    "Don't fill large surfaces with the accent colors (violet/cyan/pink/blue) — they live in the gradient and illustrations, not as chrome.",
    "Don't mix the button shapes within one context — marketing CTAs stay pills, nav/app controls stay 6px squares.",
    "Don't pile on shadows — depth is a 1px hairline plus, at most, a single finely-layered low-alpha shadow.",
    "Don't set body copy in pure black (#000000) — the brand ink is #171717 and secondary copy steps to the body grey.",
    "Don't invent a second decorative system — the hero mesh gradient is the only flourish; everything else is ink on white.",
    "Don't loosen display-heading letter-spacing — large headings carry tight negative tracking by design.",
  ],
};

