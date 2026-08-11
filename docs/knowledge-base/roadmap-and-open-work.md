# Roadmap & Open Work

What is built vs. designed-but-not-built, and what's paused. Grounded in `main` as of the
full-stack merge (PRs #2–#9), not in older doc claims.

## Built and shipped (on `main`)

The full core loop is live and persisted:

- Upload + inputs, with **screenshot natural-dimension capture** (`lib/image-dimensions.ts`).
- Claude Sonnet **critique** (signal/preference split + flagged ambiguities).
- Claude Sonnet **directions** (2–3, rationale-backed, optional pattern reference).
- Per-direction **code generation** streamed over SSE into a bottom sheet.
- **Live-mount preview** — generated TSX transpiled with Sucrase and mounted as an interactive
  component in a zero-network sandboxed iframe, with source-view fallbacks.
- **Design-system enforcement** (Geist prompt grounding + deterministic post-processing).
- **DEMO_MODE** fixture replay with write-refusal.
- **Turso round persistence** + a History section reading back recent rounds, chained via
  `previousRoundId`.

> Note on older docs: the "View & State Inventory" and "Findings Log" were written when
> `PreviewFrame` only escaped code into a `<pre>` and no round was ever persisted. Both gaps are
> now **closed** on `main` (PR #7 live-mount + dimension capture; PR #9 Turso persistence). Trust
> the code over those earlier snapshots.

## Designed but not built: the before/after visual diff

The **BeforeAfter Visual Diff — Feature Blueprint** is fully specified but has **zero code** in
the repo — no comparison component, no route, no entry-point button. It lets a designer compare
the original screenshot against a generated direction in a viewport-matched, region-focused
before/after view.

### Build-order dependencies (the blueprint's 3-stage chain)

Each stage is "worthless without the one before it":

1. **Capture (content-width autocrop)** — detect the real content width of the screenshot so the
   generated component can be scaled to the same viewport. **Partially in place:** natural
   dimensions are now captured (`screenshotDimensions`), but the *content-width autocrop*
   (canvas pixel-scan to trim chrome/letterboxing, with a confidence flag) is not yet built.
2. **Live-render (Sucrase mount)** — mount the generated component as real UI rather than text.
   **DONE** — shipped in PR #7 (`components/preview-frame.tsx`, `lib/preview/`). The visual diff
   can build directly on this.
3. **Compare** — the unified comparison view itself. **Not built.** This is the remaining work.

### Comparison view states still to build (superseded control model — see below)

> **Superseded 2026-08-11 (Decision 10, `docs/decisions.md`).** The blueprint this section was
> drawn from specified a `Before / Split / After` segmented control with a draggable divider and
> a highlight toggle. Both later-recovered context packets independently confirm the actual
> product decision is a **binary `Source` / `Iteration` toggle** in one fixed viewport box, with
> no scrubber, no split view, and no drag gesture — that decision predates this blueprint
> (pre-2026-08-08) and wins. The bullets below are kept as a historical record of the drafted
> design, not the build target. Rebuild this section's control model against Decision 10 before
> implementing.

- Unified comparison frame at best-fit scale (single frame, not two shrunk side-by-side) — **still applies** to the binary-toggle model.
- ~~Controls: **Before / Split / After** segmented control, draggable divider (`clip-path` + range input), **Highlight on/off** toggle, **Scale: fit**.~~ Replace with: a two-position `Source` / `Iteration` toggle, nothing else.
- Pixel-diff region highlight (rasterize both frames, diff `ImageData` client-side, zero LLM
  cost — chosen over asking the model to self-report a bounding box, "grading its own homework").
  Still a candidate, independent of the control-model change above.
- Off-happy-path states: streaming/partial-generation indicator (partial-height, contextual
  status text — *not* full raw code), generation-failed entry guard, legacy-round fallback (no
  captured width → default width, "scale approximate"), and the **whole-frame / rasterization-
  unreliable fallback** — surface the direction's own `rationale` + `suggestedChanges` rather
  than a bare "substantially restructured" label.
- **New, from the binary-toggle decision:** if the selected direction's code compiles but fails
  to mount, the iteration layer is source text, which cannot be stacked against an image in the
  fixed box — what the toggle does in that state is undesigned (see `docs/blueprint.md` Open
  questions).

### Data-model prerequisites for the diff

- **No region/bounding-box concept** exists on `Critique`/`Direction` — feedback doesn't know
  which screen region it targets. The diff works around this with client-side pixel-diff.
- **Content-width autocrop** field + confidence flag not yet on the model (only raw natural
  dimensions are).
- The **highlight toggle** needs new local UI state (nothing in `round-store.ts` models it).
- Locked note: if pixel-diff rasterization proves harder than expected, report effort back to
  Bryan for a call — it's a bounded spike, not an open-ended effort, and not a silent-fallback ship.

## Other planned-but-not-wired work

- **GPT-4o fallback** on Claude validation failure — intended, only the Claude branch exists.
- **Live 21st.dev MCP** pattern grounding — decided shape, mock provider today (see `decisions.md`).
- **Per-project / per-round design-system selection** — blocked on a design-system reference
  field in `Round`/`Project`; one hardcoded Geist system today.
- **W3C DTCG token-index input model** — decided format, not yet built as an input.
- **ComfyUI** optional local visual pre-iteration / asset generation — decided shape, not in the
  core loop.
- **Project management UI** — single implicit project today; no switcher.
- **Lineage/chain view** — a way to browse a chain's full history is a candidate signature
  interaction but has **not been designed yet**. Constraints on any future attempt (Decision 12,
  `decisions.md`): no branching UI, nothing implying history is editable, no drag scrubber, and
  not a list of thumbnails or a timeline row.
- **Critique, Directions, and Compare screens against the current gold visual system** — the
  Figma redesign (`docs/design-system.md`) only covers Add-image and Set-the-brief today. The
  rest of the flow still needs a pass in the current direction.

## Open product questions

Unresolved product-behavior questions surfaced during the 2026-08-11 context-packet review —
flag rather than guess when implementing adjacent work:

- Can the critique be regenerated after the fact, and does that invalidate directions already
  generated from it?
- Is there a retry path after a code-generation mount failure, or must the person pick a
  different direction entirely?
- Can a person move an item between the critique's real-problems and taste piles, or dismiss one,
  before directions are generated from it?
- Where does the lineage/chain view live in the interface, and can a person compare any two
  nodes in a chain or only adjacent ones? (See the Lineage/chain view item above.)
- What replaces the generated component's hover-driven interactivity on touch, once responsive
  work resumes (Decision 13, `decisions.md`)?

## Paused: external front-end / UX iteration

Bryan is running **front-end/UX quality passes externally** (outside this repo's automated
pipeline) against the shipped app. DEMO_MODE exists specifically to support these passes with
zero compute cost. Treat visual/UX polish decisions coming out of that work as **incoming**, and
ground any front-end change against the shipped state above — not against older doc snapshots.

