# Design System — Coquí's Own Interface

## Purpose

The visual identity, naming, brand assets, copy voice, and design history for **Coquí's own
application UI** (the upload screen, brief panel, header, etc.). This is a different thing from
the Vercel Geist system enforced on *generated preview code* — see the disambiguation note
below.

## Status

Current, authoritative visual direction: the Figma file **"Coquí Visual Explore"**
(`qzgdMASkzEkxZpRL3918QD`), frames `18:95` ("01 - add image") and `2:3` ("02 - set brief"),
extracted 2026-08-11. The literal design tokens (colors, type, radii, spacing, elevation,
component specs) are committed at the repo root in **`DESIGN.md`** — that file is the
machine-parseable source of truth for tokens; this file is the narrative context, decisions,
and history around it that don't belong in a token spec.

Only two of an eventual five-ish screens (Add image, Set the brief) are designed in this
direction today. Critique, Directions, and Compare have not been designed against the gold
system — see `docs/knowledge-base/roadmap-and-open-work.md`.

## Disambiguation: two different "design systems" in this repo

- **This file + root `DESIGN.md`** — the look of Coquí's *own* interface (the tool a designer
  uses). Gold accent, Owners Narrow + Figtree, dot-grid atmosphere.
- **`lib/design-systems/vercel-geist.ts`** — the style *enforced on code the tool generates* as
  a direction's prototype (see `docs/knowledge-base/architecture.md`, "Design-system enforcement
  pipeline"). Unrelated to Coquí's own look. Do not conflate the two when reading either doc.

## Naming and identity

- **Current product name: Coquí.** Former name: **Iteration Engine** (fully retired as a
  product name; the GitHub repository slug and some infrastructure identifiers, e.g.
  `package.json`'s `name` field and the `iteration-engine.git` repo itself, have not been
  renamed — that is a separate follow-up, not yet done).
- **Where the name comes from:** the coquí is a small tree frog native to Puerto Rico
  (*Eleutherodactylus coqui*), known for its loud, repeating two-note call — "co-quí."
- **Why it fits the product:** the product is a repeated call-and-response loop — feedback goes
  in, an iteration comes out, and the loop runs again. A sound icon in the header
  (`icon-volume-cross.svg`, currently rendered muted) is the one interface element that gestures
  at this, but nothing in the interface explains it yet, and whether it plays the actual coquí
  call, is a plain sound toggle, or is decorative is unresolved (see Open questions).
- **Written form:** always "Coquí," accent on the í. The wordmark treats the accent as a
  distinct gold-colored element.

## Visual direction history

Five visual passes exist across Bryan's local design-exploration environment (outside this
repository — none of the `project/...` paths referenced below exist in this GitHub repo).
Only the current pass's *outputs* (this file, `DESIGN.md`, the Figma file) are committed here.

| Pass | Direction | Status |
|---|---|---|
| 1 — Geist/Vercel wireframe | Black-on-near-white developer aesthetic; layout/content reference only | Superseded |
| 2 — Cream/ink "Designed" | Warm cream + ink + orange accent, left sidebar chain nav | Superseded — formally critiqued at 21/40, see Lessons below |
| 3 — "Press proof" | Proofing-press metaphor: uncoated paper, near-black ink, spot red for register marks, halftone Compare treatment | **Parked** — passed finish review, not rejected on quality; could be revived |
| 4 — "Direction 3" minimal product-tool | Figtree, blue accent, canvas-to-card transition, expand-to-modal feedback field | Superseded by the Figma move — established behaviors below still apply |
| 5 — Figma "Coquí Visual Explore" | Gold accent, Owners Narrow + Figtree, dot-grid atmosphere | **Current** |

### Typography decision: Inter → Figtree

Pass 4 was originally set in Inter. On 2026-08-10 the body font was moved to **Figtree**;
**Proxima Nova was evaluated and rejected because it is not freely licensed.** Figtree carried
forward unchanged into the current Figma pass and remains the body face in `DESIGN.md` today —
only the *display* face changed again after that, when the move into Figma introduced Owners
Narrow for headings (see the licensing question for Owners Narrow in Open design questions
below).

### Behaviors that must carry forward regardless of visual pass

Established in Pass 4 as explicit requirements and never revisited or rejected — preserve these
when building the screens that don't exist in Figma yet:

- **Canvas-to-card transition.** The center canvas starts flat white in the empty state, then
  the ground shifts to neutral while the same footprint becomes a white card — one object
  transforming, not two elements swapping.
- **Expand-to-modal feedback field preserves both the text and the caret position** in both
  directions (explicit user requirement).
- **Quiet required indicators** — marked, but not shouting, never a bare asterisk. Optional
  fields carry no label at all.
- **No invented icons or UI chrome.** If it isn't in the reference frames, it doesn't exist yet.

### Lessons from the Pass 2 critique (21/40 — Acceptable)

Findings worth not repeating when the Critique/Directions/Compare screens are eventually built:

- **P0 — the Compare screen had no visible payoff**: both reference and iteration rendered as
  the same empty placeholder, hiding the product's one differentiating claim in its own
  flagship screen.
- **P0 — ambiguous save state**: "Save and export" appeared live at the same time as a
  "round complete" label, so a user couldn't tell whether the commit had happened.
- **P1 — a direction looked pre-selected**, undercutting the fact that all directions are equal
  until chosen.
- **P2 — the tradeoff field had no visual priority**, despite being the one field a person
  actually decides on.
- **P2 — systemic low contrast** (~2.5:1) on meaningful labels.
- Error/failure states were never designed at all in this pass.

### A parked idea worth revisiting for the Compare screen

Pass 3 ("Press proof") solved the Pass 2 Compare-screen payoff problem: the live proof rendered
over a halftone-screened render of the *old* screen, with a lifted corner proving two layers
exist. Worth stealing the idea even though the pass itself is parked.

### Design-drift detector findings against Pass 4

A design-drift detector run against the Pass 4 build (`project/coqui-direction-03/setup.html`
— outside this repository, see the note at the top of "Visual direction history" above) flagged
Pass-4 leftover values not present in the gold system: colors `#d3d7e0` / `#ccd1dc` / `#d8dce4`,
radii `5px` / `99px`, and type sizes `14px` / `9px`. The detector's conclusion: **the code, not
the design system, needs to change** — i.e. the drift was in the Pass 4 build, not in the
documented gold system.

**Verified against this repository (2026-08-12):** none of those six values appear anywhere in
`app/`, `lib/`, `docs/`, or `DESIGN.md`. The flagged file never lived in this repo — it's one of
the `project/...` paths that only ever existed in Bryan's local design-exploration environment.
There is no outstanding code change required here; recorded so the punch-list isn't lost if that
local build is ever ported into or referenced from this repository again.

## Brand assets

Not yet committed to this repository — they exist in Bryan's local design-exploration
environment (`project/brand/`) and as Figma exports. Figma-hosted asset URLs expire ~7 days
after export; only the local files are durable. When these are committed here, they should land
under a conventional static-assets path (e.g. `public/brand/`).

| Asset | What it is | Status |
|---|---|---|
| `coqui-wordmark.svg` | The "Coquí" logotype for the header. Heavy italic script; the accent on the í is a separate gold element. 55.7 × 25.9. | Current |
| `coqui-illustration.svg` | Vintage-engraving illustration — a frog riding a flying goose, holding a framed picture. Empty-state hero on the upload screen. 150 × 178. | Current |
| `icon-volume-cross.svg` | Header sound toggle, muted state. 20px. | Current |
| `icon-expand.svg` | Expand-feedback-to-modal glyph. 12px. | Current |
| `bg-sky-ambient.svg` | The ambient gradient wash behind the top of the canvas. | Current |
| `coqui-mark.svg` | Two-color coquí silhouette (calling posture, inflated vocal sac, toe discs), built for 40×40 and inverted use. | Not adopted — Figma uses the wordmark instead. Undecided whether it has a future role (favicon, app icon, loading state) or should be dropped; see Open questions. |

**Illustration style:** the engraving illustration is a deliberate brand signal — antique,
hand-drawn, slightly absurd, against an otherwise clean modern interface. Any future
illustration should match this engraving register, not switch to flat vector or 3D.

## Copy and voice

### Established copy (Figma, current)

| Surface | Copy |
|---|---|
| Upload heading | "Add the screen you want to improve" |
| Dropzone action | "Select image to upload" |
| Dropzone helper | "also you can drop your image or ⌘ V to paste" |
| Stage placeholder | "This is where the resized image should be displayed after upload." |
| Stage caption | `[image-name.filetype]` · `1280 × 832 · viewport inferred` |
| Rail heading | "What should we do fix?" — typo for "What should we fix?", not yet corrected in Figma |
| Field labels | "Goal", "Feedback, as received", "Reviewer context", "Constraints" |
| Required marker | "Required" (optional fields carry no marker at all) |
| Placeholders | "Who gave this, and through what lens?" / "What must not change?" |
| Primary CTA | **"Synthesize"** (renamed from "Interpret feedback" — see `decisions.md`) |
| Mount-failure fallback | "This component compiled but failed to mount — showing the source instead." followed by the raw runtime error, e.g. `Uncaught TypeError: Cannot read properties of undefined (reading 'Component')` |

### Voice rules

- Fewer words — cut helper text that restates its own label.
- No rule-of-three cadence ("recorded, credited, and deliberately ignored" is the failure mode:
  authoritative-sounding, says one thing three times).
- Em dashes only where a comma genuinely can't do the job; label-value pairs use a middot (`·`).
- Subheadlines under section headers only when they defensibly earn it.
- Sentence case for labels, never uppercase/letterspaced.
- Never soften a required marker into a bare asterisk.

### Terminology — use these exact words

**Reference**, **viewport box**, **goal**, **feedback**, **critique**, **real problems**,
**taste**, **direction**, **grounding**, **iteration**, **round**, **lineage**, **chain**.

## Open design questions

Unresolved — flag rather than guess:

1. **Owners Narrow is a commercial typeface** (Frere-Jones). Confirm it's licensed for design
   and web use before building against it, or nominate a fallback.
2. **The header lost its stepper.** Neither current frame shows step position in the flow.
   Intentional, or not yet designed?
3. **The sound icon's behavior is unconfirmed** — coquí-call toggle, generic mute, or
   decorative? It is the one unexplained element in the header.
4. Is `coqui-mark.svg` dead, or does the frog silhouette have a future role (favicon, app icon,
   loading state)?
5. **Only four values are named Figma variables** (`Accent/onLight`, `Darker`, `Darkest`,
   `Input labels`, `Dropshadow/Med`); everything else in `DESIGN.md` was extracted as a raw
   literal. Proper tokens are needed before the system can be built against reliably at scale.
6. No hover, focus, disabled, loading, or error states have been designed in any pass.

