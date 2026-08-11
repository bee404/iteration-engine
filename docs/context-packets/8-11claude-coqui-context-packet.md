# Coquí — Context Packet

**Version:** 1.1
**Written:** 2026-08-11 (rev. same day)
**Written by:** Claude (Claude Code session, design exploration)
**Audience:** another AI agent or human picking up Coquí in a different tool

---

## 0. How to use this document

This packet exists to stop product, brand, and design thinking from drifting between tools. Read it fully before making design or product decisions about Coquí.

**Authority rules:**

1. Anything marked **CURRENT** is what the product is now. Build against it.
2. Anything marked **SUPERSEDED** is history. It is recorded so you understand *why* the current state exists and do not accidentally re-propose an abandoned idea. Do not build against it.
3. Anything marked **PARKED** was fully built, was not rejected on quality, and could be revived. Do not build against it without asking.
4. Where this packet conflicts with an older document in the repo, **this packet wins** unless the other document is dated later than 2026-08-11.

**Scope limit — read this.** This packet was assembled from one Claude Code session plus the files on disk in the design-exploration folder. The artifacts it describes span **2026-08-08 to 2026-08-11**. If decisions were made in other tools (notably Obvious AI) or in earlier sessions, **they are not in here** and this packet does not claim to cover them. Treat this as "everything Claude knows," not "everything that exists." A separate merge of the Obvious AI documentation was requested and has **not** been completed.

---

## 1. Naming and identity

| Fact | Value |
|---|---|
| Current product name | **Coquí** |
| Former name | **Iteration Engine** |
| Status of former name | Fully retired. Still appears in older files listed in §10. |

**Where the name comes from.** The coquí is a small tree frog native to Puerto Rico (*Eleutherodactylus coqui*), known for its two-note call — "co-quí" — which is where it gets its name. The call is loud, distinctive, and repeats through the night.

**Why this matters to the product.** The name is not decorative. The product is about a repeated call-and-response loop: feedback goes in, an iteration comes out, and you go again. There is already a UI element carrying this: a **sound icon in the top-right of the header** (currently rendered in the muted/`volume-cross` state). Nothing else in the interface has explained it yet. Whether that icon plays the actual coquí call, toggles sound, or is decorative is **unresolved** — see §9.

**Written form.** Always "Coquí" with the accent on the í. The wordmark treats the accent as a distinct gold-colored element.

---

## 2. Product truth

Coquí takes a screen and a pile of feedback about that screen, and converges on one justified next iteration.

**The problem it solves.** A person has a design and a pile of feedback. That feedback mixes real usability problems with personal taste, and it is not obvious which is which. Acting on all of it is wrong; acting on none of it is also wrong.

**What Coquí does, in order:**

1. Takes a reference screen (an uploaded screenshot on round one; the previous round's iteration on every later round).
2. Measures it, inferring the viewport the interface was designed for — ignoring browser chrome, device frames, and anything that is not the interface itself. **This measurement becomes a fixed box, and every visual the tool ever produces in this chain renders into exactly that box.**
3. Takes a stated goal and the raw feedback, plus optional reviewer context and constraints.
4. Returns a critique that restates the goal, then sorts the feedback into two named piles: **real problems** and **taste**.
5. From the real problems only, proposes several named strategies ("directions"). Each has a rationale, an honest tradeoff, concrete moves, and a citation to a real named external UI pattern.
6. The person picks exactly one. That produces a **live coded component** — not a picture — with working hover states.
7. That component is stacked on the reference in the same fixed box at identical coordinates. A two-position toggle switches which layer is visible. Nothing moves.
8. Save and export. Then feedback on the new iteration restarts the loop, with the iteration as the new reference.

### Positioning — the load-bearing decision

**Coquí is a convergence tool, not an exploration tool.** This is settled and is not up for redesign.

A person is working toward one answer, not surveying a design space. Consequences that follow from this and must be respected:

- **No branching, forking, merging, or version graph.** The underlying data would support one — every unselected direction is kept — but the product never exposes it as a branch.
- **History is readable and permanent, never editable.** A past selection cannot be changed and propagated forward. If someone wants a different path, they start a new chain from that node; the original chain stays intact.
- **Looking at an alternative is not the same as taking it.** A person can read an unselected direction at any node and generate its code to look at it. This is non-destructive and commits to nothing.

**The actual differentiator** is not AI critique and not code generation — other tools do both. It is that *a design and its complete, cited justification are the same object*, and because every round renders into one identical box, a person can move through that object's entire history without anything shifting under their eye.

### Product principles

1. **Convergence over exploration.** Every surface guides toward one answer per round.
2. **Perfect registration is the payoff.** Anything a round produces renders into one fixed, unmoving box.
3. **Every judgment is cited.** Critique items state their reasoning; directions additionally point to a real named external pattern.
4. **Failures degrade, they never disappear.** Code that compiles but fails to mount falls back to source plus the raw runtime error — never a blank or a generic error state.
5. **History is a stack of aligned layers**, not a changelog, thumbnail strip, or timeline row. Those forms discard registration, which is the only interesting property here.

### Users

The primary user is a designer, PM, or reviewer who owns a screen and has received feedback on it. A secondary role — the "reviewer" — supplies the feedback and optionally context about their lens ("product designer reviewing onboarding with activation in mind"); the primary user pastes that in on their behalf.

---

## 3. The workflow model

The canonical atomic breakdown lives at `project/uploads/iteration-engine-workflow-readout.md` (units U01–U29). **That document is still authoritative on behavior** — it was written as a deliberately neutral description and has not been superseded. It uses the old product name.

### The loop

```
U01 reference  ->  U02 viewport box inferred (first round only)
      |
U03 goal + U04 feedback (+ U05 reviewer context, U06 constraints)
      |
U07 interpret  ->  U08 framing, U09 real problems, U10 taste, U11 provenance
      |
U12 directions ->  U13-U17 per direction  (U18-U19 optional code, any order)
      |
U21 select exactly one
      |
U22 produce iteration
      |
U23 stack in the viewport box  ->  U24 toggle / U25 interact
      |
U26 save and export  ->  U27 confirmation
      |
U28 feedback on this iteration
      |
      +------> back to U04, with the iteration as the new reference
```

### Facts that constrain design

- **Round one and round N are structurally different.** Round one has a file picker. Round two does not — the reference is already in the system.
- **The viewport box is inferred once per chain**, not once per round.
- **The feedback field is the heaviest typing burden** and the least predictable in length. The sample is ~440 characters, but real use will include pasted Slack threads and comment dumps. Design for a much higher ceiling.
- **Three model calls sit on the critical path**, and the longest one lands immediately after the person makes their only required decision.
- **Only one decision is required per round:** which direction. Everything else is optional or is reading.
- **The densest moment is the directions stage**, by a wide margin.
- **Code generation has three outcomes, not two:** fails outright; compiles and mounts; **compiles but fails to mount** — in which case the tool degrades to the source view and surfaces the raw runtime error.
- **A drag-to-wipe scrubber was considered and explicitly removed.** The reference/iteration control is binary. Do not reintroduce a continuous drag gesture.

### The lineage

An ordered chain. Node zero is the uploaded screenshot; every node after is an iteration. Each link carries the feedback that prompted it in the reviewer's own words, the real-problems/taste split, every direction considered, the tradeoff accepted, the external pattern cited, the resulting code, and which model produced each step.

This is described as a candidate signature interaction. It has **not been designed yet.** Constraints on any future attempt: no branching UI, nothing implying history is editable, no drag scrubber, and not a list of thumbnails or a timeline row.

---

## 4. Visual direction history

Four visual passes exist. Only one is current.

### Pass 1 — Geist / Vercel wireframe · **SUPERSEDED**

Location: `project/Iteration Engine Flow.dc.html`, analysis at `project/uploads/DESIGN-vercel.md`.

Stark black-on-near-white developer-platform aesthetic. Geist Sans + Geist Mono, `#171717` ink on `#fafafa`, 1px hairline cards. Built at both 390 and 1120 widths. This was the original wireframe pass and functioned as layout/content reference, not a brand commitment.

> ⚠️ `project/uploads/DESIGN-vercel.md` contains a stray fragment of Turkish text embedded mid-YAML on the `label-sm` font-weight line. It is not a real design token and appears to be injected or pasted content. Ignore it. It has never been acted on.

### Pass 2 — Cream / ink "Designed" pass · **SUPERSEDED**

Location: `project/designed-isolated/0{1..4}-*.html`.

Warm cream (`#ece7d9`), ink (`#26251c`), orange accent (`#d2782a`), left sidebar with chain + lineage nav, 1120px. First real designed pass at the four screens.

**Formally critiqued 2026-08-08.** Scored **21/40 (Acceptable)**. Snapshot at `.impeccable/critique/2026-08-08T21-36-00Z__project-designed-isolated.md`. Findings that still matter to any future design:

- **P0 — the Compare screen had no visible payoff.** Both the reference and the iteration rendered as the same empty dotted placeholder. The product's single differentiating claim was invisible in its own flagship screen.
- **P0 — ambiguous save state.** "Save and export" was shown as live at the same time as "ROUND 01 COMPLETE," so a user could not tell whether the commit had happened.
- **P1 — DIR 01 looked pre-selected**, which fights the positioning that all three directions are equal until chosen.
- **P2 — the tradeoff field had no visual priority**, despite being the one field a person actually decides on.
- **P2 — systemic low contrast** (~2.5:1) on meaningful labels.
- Error/failure states were never designed at all.

### Pass 3 — "Press proof" · **PARKED**

Location: `project/press-proof/`, documented in the current (stale) `DESIGN.md` and `.impeccable/design.json`.

A fully finished alternative: each screen as a sheet pulled on a proofing press. Uncoated paper on a grained press-table ground, single near-black ink, spot red reserved strictly for register marks and required tags, Archivo 900 tabloid mastheads, JetBrains Mono spec strips, barcode lineage tags, deliberate ink misregistration.

Built from three user-pinned references (a brutalist grunge poster, the Opal camera site, an Off-White/Nike tactile poster). Passed a full finish review. **Not rejected on quality** — the direction simply moved elsewhere. Both prior P0s were solved here, and the Compare screen's solution is worth stealing: the live proof renders over a halftone-screened render of the *old* screen, with a lifted corner proving two layers exist.

### Pass 4 — "Direction 3" minimal product-tool · **SUPERSEDED by Figma**

Location: `project/coqui-direction-03/setup.html`, exports in `project/coqui-direction-03/for-figma/`.

Minimal SaaS surface: Figtree, restrained blue accent (`#2563eb`), white card on a neutral ground, collapsing left panel, canvas-to-card transition. Built from a FigJam board of Arcade references.

This pass established several **behaviors that survived into the current design** and must be preserved:

- **The canvas-to-card transition.** The centre canvas starts flat white in the empty state, then the ground shifts to neutral while the same footprint becomes a white card. It is one object transforming, not two elements swapping.
- **The expand-to-modal feedback field**, which preserves both the text **and the caret position** in both directions. This was an explicit user requirement.
- **Quiet required indicators** — marked, but not shouting, and not a bare asterisk.
- **Optional fields carry no label at all** — if only required fields are marked, optional is implied.

Superseded because the design moved into Figma and changed materially: gold replaced blue, a display face was introduced, the stepper was removed, and the left panel was dropped.

### Pass 5 — Figma "Coquí Visual Explore" · **CURRENT**

Figma file: `qzgdMASkzEkxZpRL3918QD` — "Coquí Visual Explore"
Frames pulled: `18:95` ("01 - add image"), `2:3` ("02 - set brief")

This is the live direction. Full system in §5.

---

## 5. The current design system

Extracted directly from the two Figma frames on 2026-08-11. Values are literal from the file.

### 5.1 Named variables (as defined in Figma)

Only four variables are formally defined. Everything else is currently a raw literal in the file — noted in §9 as a gap.

| Figma variable | Value |
|---|---|
| `Accent/onLight` | `#E2B520` |
| `Darker` | `#404253` |
| `Darkest` | `#10121A` |
| `Input labels` | Figtree SemiBold 12.5px / 100% / 0 tracking |
| `Dropshadow/Med` | `0 2px 16px #0A0D4D05`, `0 0.25px 2px #00000014` |

### 5.2 Color

**Accent — gold.** This replaced the blue of Pass 4 entirely.

| Role | Value |
|---|---|
| Accent (base) | `#E2B520` |
| Accent on light — text | `#B28800` |
| Primary button gradient | `#F5CF4F` → `#F8C105` (left to right) |
| Primary button label | `#10121A` |
| Primary button border | `rgba(16,18,26,0.12)` |
| Primary button text shadow | `0 -1px 1px rgba(255,255,255,0.4)` |

Note the primary button is **dark text on gold**, not white on a dark fill. The text-shadow is a deliberate embossing detail.

**Ink and text.**

| Role | Value | Notes |
|---|---|---|
| Darkest | `#10121A` | Button labels, keycap glyphs |
| Heading / display | `#372606` | Warm brown. Used for all Owners Narrow headings **and** for user-entered text in fields |
| Darker / input labels | `#404253` | Field labels |
| Body secondary | `#565D70` | Captions, placeholder-stage copy |
| Tertiary / meta | `#8B91A3` | "Required", character counts, dimensions |
| Placeholder | `#A8AEBD` | Empty input text |

**Surface and line.**

| Role | Value |
|---|---|
| App background | `#F8F9FB` |
| Card / panel | `#FFFFFF` |
| Header | `rgba(255,255,255,0.8)` + `backdrop-blur(2px)` |
| Card frame wrapper | `rgba(212,212,212,0.16)` + `backdrop-blur(1.5px)` |
| Border (inputs, cards) | `#E7E9EE` |
| Divider (hairline) | `#F0F2F5` |
| Dashed border (dropzone) | `#C7C9CB` |
| Keycap fill | `rgba(16,18,26,0.12)` |

### 5.3 Typography

**Two faces.**

- **Owners Narrow** (Medium) — display and section headings only. 24px, letter-spacing `0.48px`, color `#372606`. A commercial face; licensing must be confirmed (see §9).
- **Figtree** — everything else. Weights in use: Light 300, Regular 400, Medium 500, SemiBold 600, Bold 700.

| Token | Face | Size | Weight | Line height | Color |
|---|---|---|---|---|---|
| Display / section heading | Owners Narrow Medium | 24 | 500 | normal | `#372606` |
| Input label | Figtree SemiBold | 12.5 | 600 | 100% | `#404253` |
| Field value | Figtree Regular | 13 | 400 | 16px | `#372606` |
| Body / caption | Figtree Medium | 13 | 500 | normal | `#565D70` |
| Accent action text | Figtree Regular | 16 | 400 | 1.2 | `#B28800` |
| Helper | Figtree Light | 13 | 300 | 1.2 | `#404253` |
| Meta / required / count | Figtree Regular | 11 | 400 | normal | `#8B91A3` |
| Dimension readout | Figtree SemiBold | 11.5 | 600 | normal | `#565D70` |
| Button label | Figtree SemiBold | 13 | 600 | normal | `#10121A` |
| Keycap ⌘ | Figtree Bold | 11 | 700 | 1.2 | `#10121A` |
| Keycap letter | Figtree SemiBold | 10 | 600 | 1.2 | `#10121A` |

### 5.4 Radius

| Token | Value | Applied to |
|---|---|---|
| App shell | 24px | Outermost frame |
| Large | 16px | Header, right rail, card outer wrapper |
| Medium | 12px | Stage card |
| Small | 8px | Inputs, textareas, buttons, keycaps |
| X-small | 6px | Expand button |

### 5.5 Elevation

| Level | Value | Applied to |
|---|---|---|
| Chrome (`Dropshadow/Med`) | `0 0.25px 2px rgba(0,0,0,0.08)`, `0 2px 16px rgba(10,13,77,0.02)` | Header, upload card |
| Stage card | `0 2px 4px rgba(16,18,26,0.04)`, `0 18px 50px -8px rgba(16,18,26,0.16)` | The loaded reference card |
| Rail | `0 0.25px 2px rgba(0,0,0,0.12)`, `0 2px 24px rgba(10,13,77,0.12)` | Right brief panel |

Two-layer shadows throughout: a tight contact shadow plus a wide diffuse one. Never a single heavy drop.

### 5.6 Layout

- **Frame:** 1241 × 800, `16px` padding, `24px` radius, background `#F8F9FB`.
- **Header:** full width, `52px` tall, `18px` horizontal padding, `16px` radius, translucent + blurred.
- **Upload stage card:** `600 × 420`, centered.
- **Loaded stage card:** `700` wide (max `730`) × `474.48`, inside a `4px` translucent wrapper.
- **Right rail:** `320px` wide. Padding `20px` top, `20px` sides, `24px` bottom. `16px` gap between field groups.
- **Field group:** `6px` gap between label row and control.
- **Goal textarea:** `52px` tall.
- **Feedback textarea:** `95px` tall, right padding `34px` to clear the expand button.
- **Expand button:** `24 × 24`, positioned `7px` from top and right.
- **Primary button:** `36px` tall, full rail width, `14px` horizontal padding.

### 5.7 Atmosphere — do not skip this

The current direction is **not** a flat minimal SaaS surface. Three atmospheric layers give it its character, and dropping them collapses it back into Pass 4:

1. **Dot grid.** Covers the canvas area from `y=92` down. Vignetted by an inset shadow (`inset 0 0 36px 12px #F8F9FB`) so it fades at the edges rather than ending hard.
2. **Ambient gradient wash.** A band of soft colored ellipses across the top ~298px, using `mix-blend-mode: hard-light` and `plus-lighter`. Asset: `project/brand/bg-sky-ambient.svg`. On the upload frame this is richer (four ellipses); on the brief frame it is reduced to one.
3. **Edge fades.** A white gradient fades the bottom `164px` on the upload frame, and the right `372px` on the brief frame, so content dissolves rather than being cut.

### 5.8 Component notes

- **Header:** logo left, sound icon right. A "Need help? Get in touch" element exists in the file but is **hidden** — it was carried from Pass 4 and switched off.
- **Dropzone:** dashed `#C7C9CB` border, white fill, `8px` radius, `24px`/`16px` padding. Contains an accent-gold action line, a helper line, and inline **⌘V keycaps**. Paste-to-upload is a real affordance, not decoration.
- **Feedback textarea:** has a bottom-edge white gradient (`24px`) indicating scrollable overflow, plus the expand button top-right.
- **Required marker:** the word "Required" at 11px in `#8B91A3`, right-aligned on the label row. Optional fields carry **no marker at all**.
- **Stage caption:** sits *below* the card at 50% opacity — filename left, `1280 × 832 · viewport inferred` right.

### 5.9 What was removed relative to Pass 4

Do not reintroduce these without asking:

- **The 5-step stepper** (Upload / Set the brief / Critique / Directions / Compare) is gone from both frames.
- **The left source panel** is gone. Upload is a single centered card.
- **The blue accent** is gone, replaced by gold.
- **"Need help? Get in touch"** is hidden.

---

## 6. Brand assets

All assets are downloaded locally at `project/brand/`. **Figma asset URLs expire ~7 days after export (≈2026-08-18)** — always use the local files, never re-fetch a stale URL.

| File | What it is | Status |
|---|---|---|
| `coqui-wordmark.svg` | The "Coquí" logotype used in the header. Heavy italic script; the accent on the í is a separate gold element. 55.68 × 25.89. | **CURRENT** |
| `coqui-illustration.svg` | Vintage engraving-style illustration: a frog riding a flying goose, holding up a framed picture. Used as the empty-state hero on the upload screen. 150 × 178. | **CURRENT** |
| `icon-volume-cross.svg` | Sound icon in the header, muted state. 20 × 20. | **CURRENT** |
| `icon-expand.svg` | Expand-feedback-to-modal icon. 12 × 12. | **CURRENT** |
| `bg-sky-ambient.svg` | The ambient gradient wash. | **CURRENT** |
| `coqui-mark.svg` | A two-color coquí silhouette (calling posture, inflated vocal sac, toe discs), built to stay legible at 40×40 and inverted. | **UNUSED — see §9** |

### Illustration style

The engraving illustration is a strong and deliberate brand signal — it is antique, hand-drawn, and slightly absurd, sitting against an otherwise clean modern interface. That contrast appears intentional. **Any future illustration should match this engraving style**, not switch to flat vector or 3D. There is currently exactly one illustration; a second surface needing art will need one commissioned or generated in the same register.

---

## 7. Copy and voice

### Established copy (current, from Figma)

| Surface | Copy |
|---|---|
| Upload heading | "Add the screen you want to improve" |
| Dropzone action | "Select image to upload" |
| Dropzone helper | "also you can drop your image or ⌘ V to paste" |
| Stage placeholder | "This is where the resized image should be displayed after upload." |
| Stage caption | `[image-name.filetype]` · `1280 × 832 · viewport inferred` |
| Rail heading | "What should we do fix?" ⚠️ **typo — see §10** |
| Field labels | "Goal", "Feedback, as received", "Reviewer context", "Constraints" |
| Required marker | "Required" |
| Placeholders | "Who gave this, and through what lens?" / "What must not change?" |
| Primary CTA | **"Synthesize"** |

### Voice rules established through review

These were derived from an explicit copy pass and should hold:

- **Fewer words.** Cut helper text that restates its own label.
- **No rule-of-three cadence.** "Recorded, credited, and deliberately ignored" is the failure mode — it sounds authoritative and says one thing three times.
- **Em dashes only where a comma genuinely cannot do the job.** Label-value pairs use a middot (`·`) instead.
- **Subheadlines under section headers only when they defensibly earn it.**
- **Sentence case for labels**, not uppercase letterspaced.
- **Never soften a required marker into a bare asterisk.**

### Terminology — use these exact words

**Reference**, **viewport box**, **goal**, **feedback**, **critique**, **real problems**, **taste**, **direction**, **grounding**, **iteration**, **round**, **lineage**, **chain**.

Note: the CTA changed from "Interpret feedback" (Pass 4) to **"Synthesize"** (Figma). "Synthesize" is current.

---

## 8. Decisions log

Dated where a date is verifiable from a file or the session record. Ordering within a day is sequential but the exact clock time is not always known.

| Date | Decision | Provenance |
|---|---|---|
| pre-2026-08-08 | Product is a **convergence tool, not an exploration tool**. No branching, forking, or version graph in the product. | Stated as settled in `iteration-engine-workflow-readout.md` |
| pre-2026-08-08 | **Drag-to-wipe scrubber removed.** The reference/iteration control is binary. | Same |
| pre-2026-08-08 | Storage rule: **always keep all directions for every node; never keep code until someone asks for it.** | Same |
| pre-2026-08-08 | **Past selections cannot be changed and propagated forward.** Ruled out on correctness grounds, not just scope. | Same |
| pre-2026-08-08 | "Approve round" replaced by a single commit action: **Save and export**. | Same |
| 2026-08-08 | Cream/ink pass critiqued: **21/40**. Two P0s identified. | `.impeccable/critique/2026-08-08T21-36-00Z__*.md` |
| 2026-08-09 | Press-proof direction built from three user-pinned references and passed finish review. **Parked**, not rejected. | `project/press-proof/`, `DESIGN.md` |
| 2026-08-09 | **Lean working path adopted:** build directly; skip the full Impeccable review chain unless explicitly asked. Driven by token cost — the review apparatus cost several times the build. | User instruction, saved to memory |
| 2026-08-10 | Direction 3 built from Arcade references. Blue accent, Figtree, canvas-to-card transition, expand-to-modal with caret preservation. | `project/coqui-direction-03/setup.html` |
| 2026-08-10 | Required indicators made subtle; **"Optional" labels removed entirely.** | User note on reference screenshot |
| 2026-08-10 | **No invented icons or UI elements.** Collapsed icon rail removed as invented chrome. | Same |
| 2026-08-10 | Font moved Inter → **Figtree**. Proxima rejected as not freely licensed. | User instruction |
| 2026-08-10 | Coquí mark drawn — two-color, legible at 40px. **Not adopted**; Figma uses a wordmark instead. | `project/brand/coqui-mark.svg` |
| 2026-08-11 | Responsive/adaptive work **explicitly stopped**. Desktop-only for now; responsive is a known future requirement. | User instruction |
| 2026-08-11 | Design moved into Figma. **Gold accent replaces blue. Owners Narrow introduced as display face. Stepper removed. Left panel removed.** | Figma `qzgdMASkzEkxZpRL3918QD` |
| 2026-08-11 | Primary CTA renamed **"Synthesize"**. | Figma frame `2:3` |
| 2026-08-11 | Figma assets exported locally to `project/brand/`. | Directory listing |
| 2026-08-11 | **`DESIGN.md` replaced** — press-proof system swapped for the Coquí system. Detector findings flipped from false positives to true drift against the Pass 4 build. | `DESIGN.md`, detector run |

---

## 9. Open questions

Unresolved. Do not invent answers — flag them.

**Product**

1. Can a person see or correct the inferred viewport box if the tool measures it wrong? Everything downstream depends on it.
2. Does a later round inherit the goal, reviewer context, and constraints, or re-ask?
3. Is the direction count fixed at 3?
4. Can a person move an item between the real-problems and taste piles, or dismiss one, before directions are generated?
5. Can the critique be regenerated? Does that invalidate the directions?
6. Is there a retry path after a mount failure, or must the person pick a different direction?
7. **If the selected direction fails to mount, the iteration layer is source code, which cannot be stacked against an image. What does the toggle do?**
8. What does "Save and export" actually produce — source, a rendered file, a link, several?
9. The iteration's interactivity is hover-driven. What replaces that value on touch?
10. Can a person compare any two lineage nodes, or only adjacent ones? Where does the lineage live in the interface?

**Design**

11. **What is the sound icon for?** It is rendered muted. Does it play the coquí call, toggle sound, or is it decorative? It is the only unexplained element in the header.
12. **Is `coqui-mark.svg` dead?** Figma uses a wordmark. Decide whether the frog silhouette has a role (favicon, app icon, loading state) or should be deleted.
13. **Owners Narrow licensing.** It is a commercial face. Confirm the license covers web embedding before building. If not, a substitute is needed and the display voice changes.
14. **Only four Figma variables are defined.** Most values are raw literals. The system needs proper tokens before it can be built against reliably.
15. **How did the stepper's job get reassigned?** Removing it removed the only progress indicator. Unresolved whether progress is shown some other way.
16. Screens 3 and 4 (Critique, Directions, Compare) have **not been designed in the current direction.** Only Upload and Set-the-brief exist in Figma.
17. Responsive behavior is deferred. The current design is desktop-only at ~1241px.
18. No error, empty, loading, or failure states have been designed in any pass.

---

## 10. Known conflicts and drift risks

Things that will actively cause drift if a new agent is not warned:

1. **RESOLVED 2026-08-11 — `DESIGN.md` now correctly documents Coquí.** It was replaced (it previously documented the parked press-proof direction). It is now the authoritative system doc and agrees with §5 of this packet. The old sidecar `.impeccable/design.json` was removed rather than updated; its absence is preferable to it being wrong, but Impeccable may regenerate it.

2. **The design detector's ~21 findings against `project/coqui-direction-03/setup.html` are now TRUE, not false positives.** Before `DESIGN.md` was replaced they were noise; now they correctly report that the build has not caught up to the current system. Flagged: colors `#d3d7e0` / `#ccd1dc` / `#d8dce4`, radii `5px` / `99px`, and type sizes `14px` / `9px` — all Pass 4 leftovers absent from the gold system. **The code, not the design system, is what needs to change.**

3. **"What should we do fix?"** in the Figma rail heading is a typo. Almost certainly "What should we fix?". Not yet corrected in Figma.

4. **Old product name persists** in: `project/Iteration Engine Flow.dc.html`, `project/press-proof/*` (in visible UI text), `project/designed-isolated/*`, `DESIGN.md`, and `project/uploads/iteration-engine-workflow-readout.md`. Only the readout is still authoritative; the rest are superseded.

5. **`project/coqui-direction-03/for-figma/*.html` are generated exports.** They are overwritten from `setup.html`. Never edit them directly.

6. **Figma asset URLs expire ≈2026-08-18.** Use `project/brand/` local files.

7. **The Obvious AI documentation has not been merged.** A merge was requested — reconciling decisions across both tools with timestamps so newer decisions are not overwritten by older ones — and has not happened. Until it does, this packet may be missing decisions made there.

8. **This folder is not a git repo.** No `.git`, no remote. The work lives in Dropbox.

---

## 11. File map

```
PRODUCT.md                              Product truth. CURRENT (uses old name in places).
DESIGN.md                               Design system for Coquí. CURRENT and authoritative.
.impeccable/critique/2026-08-08…md       Formal critique of the cream/ink pass. Historical.

docs/coqui-context-packet.md            This file.

project/uploads/
  iteration-engine-workflow-readout.md  Atomic workflow spec U01–U29. AUTHORITATIVE on behavior.
  DESIGN-vercel.md                       Analysis of Pass 1. Historical. Contains injected text — ignore.

project/brand/                          All brand assets. CURRENT except coqui-mark.svg.

project/coqui-direction-03/setup.html   Pass 4 build. SUPERSEDED but holds live behaviors
                                        (canvas-to-card, expand-modal caret preservation).
project/coqui-direction-03/for-figma/   Generated per-state exports. Do not edit.

project/press-proof/                    Pass 3. PARKED, complete, finish-reviewed.
project/designed-isolated/              Pass 2. SUPERSEDED. The critique target.
project/Iteration Engine Flow.dc.html   Pass 1. SUPERSEDED.
```

---

## 12. If you are an agent picking this up

Do this in order:

1. Read `project/uploads/iteration-engine-workflow-readout.md` for behavior. It is long and it is worth it.
2. Build against `DESIGN.md` — it is current and authoritative. §5 here is the same system with extraction provenance attached.
3. Treat the two Figma frames as the visual source of truth. Only two of five screens are designed.
4. Preserve the behaviors listed in §4 Pass 4 — particularly caret preservation in the expand modal and the canvas-to-card transition.
5. Never introduce branching, version-graph, or editable-history affordances. See §2.
6. Flag §9 questions rather than answering them yourself.
