---
version: alpha
name: Coquí
description: >
  A warm, atmospheric product surface for a convergence tool. Near-white app ground
  carrying a faint dot-grid field and a soft ambient wash at the horizon; content
  arrives as white cards floating on it, each held by a translucent bezel rather than
  a border. A single gold accent — the coquí's own color — marks the one committing
  action and nothing else. Owners Narrow sets the headings in warm brown; Figtree
  carries every label, field, and caption.

colors:
  accent: "#e2b520"
  accent-text: "#b28800"
  accent-grad-start: "#f5cf4f"
  accent-grad-end: "#f8c105"
  display-ink: "#372606"
  ink: "#10121a"
  ink-label: "#404253"
  ink-body: "#565d70"
  ink-mute: "#8b91a3"
  ink-placeholder: "#a8aebd"
  ground: "#f8f9fb"
  surface: "#ffffff"
  surface-veil: "rgba(255,255,255,0.8)"
  bezel: "rgba(212,212,212,0.16)"
  line: "#e7e9ee"
  line-soft: "#f0f2f5"
  line-dashed: "#c7c9cb"
  keycap: "rgba(16,18,26,0.12)"
  hairline-strong: "rgba(16,18,26,0.12)"

typography:
  display:
    fontFamily: Owners Narrow, sans-serif
    fontSize: 24px
    fontWeight: 500
    lineHeight: normal
    letterSpacing: 0.48px
  label:
    fontFamily: Figtree, sans-serif
    fontSize: 12.5px
    fontWeight: 600
    lineHeight: 100%
    letterSpacing: 0
  body:
    fontFamily: Figtree, sans-serif
    fontSize: 13px
    fontWeight: 400
    lineHeight: 16px
  body-medium:
    fontFamily: Figtree, sans-serif
    fontSize: 13px
    fontWeight: 500
    lineHeight: normal
  action:
    fontFamily: Figtree, sans-serif
    fontSize: 13px
    fontWeight: 600
    lineHeight: normal
  lead:
    fontFamily: Figtree, sans-serif
    fontSize: 16px
    fontWeight: 400
    lineHeight: 1.2
  hint:
    fontFamily: Figtree, sans-serif
    fontSize: 13px
    fontWeight: 300
    lineHeight: 1.2
  meta:
    fontFamily: Figtree, sans-serif
    fontSize: 11px
    fontWeight: 400
    lineHeight: normal
  meta-strong:
    fontFamily: Figtree, sans-serif
    fontSize: 11.5px
    fontWeight: 600
    lineHeight: normal
  keycap:
    fontFamily: Figtree, sans-serif
    fontSize: 11px
    fontWeight: 700
    lineHeight: 1.2

rounded:
  sm: 6px
  md: 8px
  lg: 12px
  xl: 16px
  shell: 24px

spacing:
  xxs: 4px
  xs: 6px
  sm: 8px
  md: 11px
  lg: 16px
  xl: 20px
  2xl: 24px
  3xl: 36px
  4xl: 40px

elevation:
  raised: "0 0.25px 2px rgba(0,0,0,0.08), 0 2px 16px rgba(10,13,77,0.02)"
  card: "0 2px 4px rgba(16,18,26,0.04), 0 18px 50px -8px rgba(16,18,26,0.16)"
  panel: "0 0.25px 2px rgba(0,0,0,0.12), 0 2px 24px rgba(10,13,77,0.12)"
  vignette: "inset 0 0 36px 12px #f8f9fb"

components:
  app-shell:
    backgroundColor: "{colors.ground}"
    rounded: "{rounded.shell}"
    padding: "{spacing.lg}"
  header:
    backgroundColor: "{colors.surface-veil}"
    backdropFilter: blur(2px)
    rounded: "{rounded.xl}"
    height: 52px
    padding: "0 18px"
    elevation: "{elevation.raised}"
  stage-card:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.lg}"
    elevation: "{elevation.card}"
    bezel: "4px {colors.bezel}, blur(1.5px), {rounded.xl}"
  brief-panel:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.xl}"
    width: 320px
    padding: "20px 20px 24px"
    elevation: "{elevation.panel}"
  field:
    backgroundColor: "{colors.surface}"
    borderColor: "{colors.line}"
    rounded: "{rounded.md}"
    padding: "9px 11px"
    typography: "{typography.body}"
  button-primary:
    background: "linear-gradient(90deg, {colors.accent-grad-start}, {colors.accent-grad-end})"
    borderColor: "{colors.hairline-strong}"
    textColor: "{colors.ink}"
    textShadow: "0 -1px 1px rgba(255,255,255,0.4)"
    rounded: "{rounded.md}"
    height: 36px
    typography: "{typography.action}"
  icon-button:
    backgroundColor: "{colors.surface}"
    borderColor: "{colors.line}"
    rounded: "{rounded.sm}"
    size: 24px
  dropzone:
    backgroundColor: "{colors.surface}"
    borderColor: "{colors.line-dashed}"
    borderStyle: dashed
    rounded: "{rounded.md}"
    padding: "16px 24px"
  keycap:
    backgroundColor: "{colors.keycap}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    height: 20px
    padding: "2px 6px"
    typography: "{typography.keycap}"

---

## Overview

Coquí's surface is built from three layers that never change role: an **atmospheric ground**, **floating white content**, and **one gold action**.

The ground is `{colors.ground}` (#f8f9fb) carrying a faint dot grid, vignetted at its own edges with an inset glow (`{elevation.vignette}`) so the field fades out rather than terminating. Above it, at the top of the frame, a band of soft gradient ellipses sits in `mix-blend-hard-light` and `plus-lighter` — a horizon, not a hero. Directional white gradients fade the field out at the bottom (upload) and right (brief), keeping the eye centered.

Content sits on that ground as **white cards**, and the defining detail is that they are not bordered. The stage card is wrapped in a 4px translucent bezel (`{colors.bezel}` with a 1.5px backdrop blur) at `{rounded.xl}`, holding a `{rounded.lg}` white card inside it. The effect is a mount around a print rather than a stroke around a box.

Type is a **two-family split with a warm/cool tension**. Headings are Owners Narrow Medium at 24px in `{colors.display-ink}` (#372606), a warm brown that belongs to the gold rather than to the grey UI. Everything else is Figtree, stepping down 16 → 13 → 12.5 → 11px in a cool grey ladder. The heading face is the only place the brand speaks; the rest is quiet apparatus.

**Gold is rationed to one thing.** `{colors.accent}` (#e2b520) and its gradient appear on the single committing action per screen and nowhere else. Its readable sibling `{colors.accent-text}` (#b28800) marks the one primary invitation in an empty state ("Select image to upload"). There is no gold chrome, no gold borders, no gold status.

**Key characteristics**

- Dot-grid ground with an inset vignette, plus a top ambient gradient band — atmosphere, never a decorative hero.
- White cards float on a translucent bezel; borders are reserved for inputs.
- One gold gradient button per screen carries the commit; a warm-brown display face ties the heading to it.
- Figtree SemiBold 12.5px is the single named label token — sentence case, never uppercase.
- Header is a floating translucent bar (`{colors.surface-veil}` + 2px backdrop blur), not a page-width rule.
- Required is stated in quiet grey `{colors.ink-mute}` at 11px; optional is left unmarked.

## Colors

### Accent
- **Gold** (`{colors.accent}` — #e2b520): the brand color, from the coquí itself. Reserved for the primary action's gradient (`{colors.accent-grad-start}` → `{colors.accent-grad-end}`).
- **Gold text** (`{colors.accent-text}` — #b28800): the darkened tone used when the accent must carry readable text on white.

### Ink
- **Display** (`{colors.display-ink}` — #372606): warm brown, headings only, always Owners Narrow.
- **Darkest** (`{colors.ink}` — #10121a): button labels, keycaps, high-emphasis values.
- **Label** (`{colors.ink-label}` — #404253): field labels.
- **Body** (`{colors.ink-body}` — #565d70): captions, in-card copy.
- **Mute** (`{colors.ink-mute}` — #8b91a3): required marks, counters, metadata.
- **Placeholder** (`{colors.ink-placeholder}` — #a8aebd): empty field text.

### Surface & line
- **Ground** (`{colors.ground}` — #f8f9fb), **Surface** (#ffffff), **Veil** (`{colors.surface-veil}`) for the blurred header, **Bezel** (`{colors.bezel}`) for the card mount.
- **Line** (`{colors.line}` — #e7e9ee) on inputs; **Line-soft** (`{colors.line-soft}`) for the divider above the commit; **Dashed** (`{colors.line-dashed}`) for the dropzone only.

## Typography

Two families. **Owners Narrow** (Medium) sets every heading at 24px / +0.48px tracking. **Figtree** sets everything else across Light, Regular, Medium, SemiBold, and Bold.

| Token | Size | Weight | Use |
|---|---|---|---|
| `{typography.display}` | 24px | 500 | Screen and panel headings (Owners Narrow) |
| `{typography.lead}` | 16px | 400 | Primary invitation in an empty state |
| `{typography.body}` | 13px | 400 | Field values, in-card copy |
| `{typography.body-medium}` | 13px | 500 | Captions, filenames |
| `{typography.action}` | 13px | 600 | Button labels |
| `{typography.hint}` | 13px | 300 | Secondary instruction beside an action |
| `{typography.label}` | 12.5px | 600 | Field labels — the one named type variable |
| `{typography.meta-strong}` | 11.5px | 600 | Measurements inside metadata lines |
| `{typography.meta}` | 11px | 400 | Required marks, counters, metadata |
| `{typography.keycap}` | 11px | 700 | Keyboard glyphs |

**Principles**

- Labels are sentence case. Uppercase and letterspacing appear nowhere in this system.
- Only headings are warm; every other tone is on the cool grey ladder.
- Figtree Light (300) exists for exactly one role — the quiet half of a two-part instruction.

## Layout

**Grid.** Two zones inside a 16px-padded shell: a flexible centered stage and a fixed 320px brief panel. The stage card is 700px wide (max 730) at the reference viewport's ratio; the upload card is a fixed 600 × 420.

**Rhythm.** Panel interior stacks at 16px between field groups, 6px between a label and its control. The commit action is separated by a 36px gap and a `{colors.line-soft}` rule, so it never sits in the same rhythm as the fields.

**Captions ride outside the frame.** The filename and inferred viewport sit below the stage card at 50% opacity, inset 40px — attached to the artifact but not part of it.

## Elevation & depth

| Level | Treatment | Use |
|---|---|---|
| Raised | `{elevation.raised}` | Header bar |
| Card | `{elevation.card}` | Stage card — a wide, diffuse float |
| Panel | `{elevation.panel}` | Brief panel — deeper and closer |
| Vignette | `{elevation.vignette}` | Inset glow fading the dot grid at its edges |

Depth is atmospheric, not structural. Nothing in this system uses a shadow to imply a border, and no content card carries a stroke — the bezel and the shadow do that work.

## Shapes

| Token | Value | Use |
|---|---|---|
| `{rounded.sm}` | 6px | Small icon buttons |
| `{rounded.md}` | 8px | Inputs, buttons, keycaps, dropzone |
| `{rounded.lg}` | 12px | Content cards |
| `{rounded.xl}` | 16px | Floating panels, header, card bezel |
| `{rounded.shell}` | 24px | The application shell itself |

Radius grows with the size of the thing it wraps — a consistent ladder, with the shell as the softest corner on screen.

## Components

**`header`** — floating translucent bar, 52px, `{rounded.xl}`, `{colors.surface-veil}` at 2px backdrop blur, `{elevation.raised}`. Holds the wordmark left and a single icon button right. It floats inside the shell padding rather than spanning the full width.

**`stage-card`** — white, `{rounded.lg}`, `{elevation.card}`, wrapped in a 4px `{colors.bezel}` mount at `{rounded.xl}` with a 1.5px backdrop blur.

**`brief-panel`** — white, `{rounded.xl}`, 320px, `{elevation.panel}`, padded `20px 20px 24px`. A floating panel, not a bordered column.

**`field`** — white, 1px `{colors.line}`, `{rounded.md}`, `9px 11px`. Label above at `{typography.label}`, required mark at `{typography.meta}` in `{colors.ink-mute}` on the same row, right-aligned. A textarea overflowing its height gets a bottom white gradient fade and reserves 34px right padding for the expand button.

**`button-primary`** — the only gold in the system. 36px, `{rounded.md}`, left-to-right gradient with a 1px `{colors.hairline-strong}` border and a `0 -1px 1px rgba(255,255,255,0.4)` text shadow that gives the label a struck, physical edge.

**`icon-button`** — 24px, white, 1px `{colors.line}`, `{rounded.sm}`; holds a 12px glyph.

**`dropzone`** — white with a dashed `{colors.line-dashed}` border, `{rounded.md}`, `16px 24px`. Contains the gold invitation, then a light instruction line with inline keycaps.

**`keycap`** — 20px tall, `{colors.keycap}` fill, `{rounded.md}`, Figtree Bold 11px.

## Motion

Not specified in these frames. The established behavior — a flat white canvas cross-fading into a floating card as the ground resolves into the atmospheric field — is compatible with this system and should be preserved. Any addition needs a `prefers-reduced-motion` guard.

## Do's and Don'ts

**Do**

- Keep gold on the commit action and the single empty-state invitation. Nothing else.
- Let cards float on the bezel; reserve strokes for inputs.
- Set headings in Owners Narrow warm brown; set everything else in Figtree grey.
- State "Required" quietly in `{colors.ink-mute}`; leave optional fields unmarked.
- Keep the dot-grid ground and its vignette — the atmosphere is the identity.

**Don't**

- Don't uppercase or letterspace a label.
- Don't add a second accent, or use gold as a border, status, or fill.
- Don't put a stroke on a content card.
- Don't introduce a third family; Owners Narrow and Figtree carry everything.
- Don't let the top gradient become a hero — it is a horizon behind the work.

## Assets

Stored from the source-frame exports under `public/brand/`; use these repository copies rather than expiring Figma asset URLs:

- `coqui-wordmark.svg` — the Coquí logotype, 55.7 × 25.9
- `coqui-illustration.svg` — engraved frog-and-goose empty-state illustration, 150 × 178. No longer rendered anywhere (see the upload screen entry below) but kept in the repo for a possible future return alongside the `coqui` theme.
- `coqui-logo-lockup-dark.svg` / `coqui-logo-lockup-light.svg` — the upload screen's empty-state graphic: Topo texture + two Dot grid vectors + the Coquí wordmark, composed as one full-color lockup per theme (Figma node 182:491, "Coqui themes", with Dark at 182:492 and Light at 182:483), 520 × 162 each. The two variants are NOT color-identical — the Light wordmark uses a gradient fill tuned for a white surface that reads as noise on Obsidian53's dark surface, and vice versa — so both are shipped and toggled by `[data-theme]` in `globals.css` (`.upload-illustration-dark` / `.upload-illustration-light`) rather than sharing one asset across themes.
- `icon-volume-cross.svg` — header sound toggle, 20px
- `icon-expand.svg` — expand-feedback glyph, 12px
- `bg-sky-ambient.svg` — the top gradient band
- `coqui-mark.svg` — two-color silhouette mark, for favicon and small-scale use (authored separately)

## Resolved implementation guidance

1. **Owners Narrow is the approved display face.** It is a commercial Frere-Jones typeface. Supply a licensed design/web asset before production implementation; do not silently replace it with a different visual direction. The generic `sans-serif` entry in the token is a technical fallback only.
2. **The header has no stepper by design.** Do not restore the removed four-stage control. Each screen communicates its own place in the workflow through its content.
3. **The sound icon controls the coquí call.** It defaults to muted (`volume-cross`), toggles between play and mute states, and requires accessible `Play coquí call` / `Mute coquí call` labels. Keep the control disabled until the call audio asset is available.
4. **The wordmark and silhouette have separate jobs.** Use `coqui-wordmark.svg` in the header. Reserve `coqui-mark.svg` for favicon, app-icon, and other small-scale identity uses.
5. **The canonical panel heading is "What should we fix?"** This corrects the typo in the source Figma frame; do not reproduce "What should we do fix?" in implementation.
6. **The primary action is labeled "Synthesize".** This is the settled replacement for "Interpret feedback" across the workflow.
7. **Every color, radius, and family in this document is a token, not the default.** Each is a CSS custom property in `app/globals.css`; the gold shell described here currently lives in a `[data-theme="coqui"]` override block rather than `:root` — see "Themes" below for which theme is default today and why that's expressed as a token swap, not a rewrite of this document.
8. **Missing interaction states extend this system rather than reopen it.** Derive hover, focus, disabled, loading, and error states from the existing neutral, ink, line, and gold tokens. Preserve keyboard visibility, contrast, and reduced-motion behavior without introducing another accent.

## Themes

This document specifies the **`coqui` theme** — the gold accent, dot-grid ground, and Owners Narrow / Figtree stack described above. It is no longer the default (see below) but every rule and token in this document still describes it accurately; only which theme `:root` resolves to has changed.

The active default is **`obsidian53`**: Bryan's Obsidian53 studio direction, "Pairing 2C", now the sole brand direction Coquí ships under. Neither theme is wired to `prefers-color-scheme` — this is a brand choice, not a dark-mode toggle.

`coqui` is currently **retired from user view, not removed**: `THEME_SWITCHING_ENABLED` in `lib/theme.ts` is `false`, so the visible toggle (`ThemeSwitch`) renders nothing and there is no way for a user to reach it. Its tokens, CSS, and the switching infrastructure are all fully intact — flipping that one flag is the entire re-enable path. Treat every `coqui`-specific instruction below ("the gold shell", "the default theme") as describing the theme, not today's first impression.

### How themes work

A theme is a block of CSS custom property overrides in `app/globals.css` and nothing else. There is one selector per non-default theme; today that's `[data-theme="coqui"]`, since `obsidian53` is default. No component, layout, or spacing rule is duplicated per theme.

The default theme is the **absence** of the attribute, not `data-theme="obsidian53"`, so `:root` alone is the default and there is exactly one way to be default. Which theme is default is purely a question of which token block sits in `:root` versus behind a `[data-theme="..."]` selector — reversing it again later means moving blocks, not touching a component.

Adding a theme means adding a token block, an entry to `THEMES` in `lib/theme.ts`, and its successor in that file's `SUCCESSOR` map. It should not mean touching component CSS. If it does, a hardcoded value has leaked into a component rule and belongs in a token instead.

### Tokens a theme must set

Beyond the ground/surface/ink/line ladder, three groups are easy to miss and will silently break a theme that inverts the ink ladder:

- **`--on-accent-ink` and `--on-solid`.** These are *not* interchangeable, and neither can be derived from `--ink`. `--on-accent-ink` is type on a light accent field (the gold/banana buttons); it stays dark in every theme because the accent field stays light in every theme. `--on-solid` is type on an inverted-ink chip, and it does flip with the ladder.
- **`--illustration-ink`.** Still declared by both themes, but currently unconsumed: the upload screen's empty-state graphic is now the full-color `coqui-logo-lockup-dark.svg` / `coqui-logo-lockup-light.svg` lockups, rendered as plain `<img>`s toggled by `[data-theme]` rather than a CSS mask, so each theme gets its own baked-in paint rather than deriving color from a shared token. Revive the token if a future illustration goes back to a single-path mask that should recolor per theme.
- **`--bloom` and `--grain-opacity`.** Both are inert in the default theme (`none` and `0`). Obsidian53 turns them on for its single diffuse bloom and 0.06 grain wash.

### Selection and persistence

`ThemeSwitch` (`components/theme-switch.tsx`) sits on the app chrome, bottom-right — but only while `THEME_SWITCHING_ENABLED` is `true`; it is currently `false`, so `app-chrome.tsx` doesn't mount it and there is no visible toggle. The preference lives in `lib/stores/theme.ts` (zustand + `persist`, localStorage key `coqui:theme`) — the app's first persisted user preference, and the pattern to follow for the next one.

The store owns the DOM write, not a component effect, so the attribute changes exactly when the preference does. `THEME_INIT_SCRIPT` in `lib/theme.ts` runs inline in `<head>` before first paint so a returning user never sees a frame of the wrong theme.

### Obsidian53 constraints

Carried from the Obsidian53 brand system; do not relax them without Bryan:

1. **One voltage.** Neutrals plus exactly one saturated color per frame. Banana `#f9f996` is that color, and it is reserved for the single call to action — which is why the empty-state illustration takes Soft rather than the accent.
2. **Banana only touches the darks.** As type it needs Ink `#1e1f27` or darker behind it. On a banana field the type inverts to Ink.
3. **Surfaces are never flat white**, and `#ffffff` stays reserved so true white can still pop. It is not a default surface.
4. **Instrument Serif ships weight 400 only.** Never request a heavier weight off `--font-display` or the browser synthesises a faux-bold.
5. **Micro-labels are tracked to +0.28em** and are not to be tightened; that tracking is the identifying tic of Pairing 2C.

### Texture library

Obsidian53 has two approved organic material families: **Fissure**, a sparse network of hairline Banana-lit fractures in a nearly black field, and **Mineral**, a layered rough stone with fine relief, deep cavities, and restrained warm inclusions. The user-adjusted reference images and the regeneration contract live in [`docs/brand/texture-system.md`](docs/brand/texture-system.md).

Treat these textures as a material system, not as fixed decorative images. New outputs should be a new cut from the same stone: preserve the palette, roughness, contrast hierarchy, and detail scale while changing the seed, topology, fold map, crop, or local density. Keep the tileable base separate from any vignette or edge fade, and validate repeated use with a 3 × 3 preview.

When these assets are shown in future brand comps, place them inside an adventurous studio webpage concept rather than a framed picture or presentation board. Organic, real-feeling material should meet precise digital structure. Parallax, scroll-revealed shimmer, and bloom may be explored in the web implementation, but glow must remain sparse and subordinate to the stone.
