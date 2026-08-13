# Roadmap & Open Work

What is built vs. designed-but-not-built, and what's paused. Grounded in `main` as of the
full-stack merge (PRs #2–#9), not in older doc claims.

## Built and shipped (on `main`)

The implemented generation loop is live and persisted:

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

## Designed but not built: the fixed-box comparison

The fixed-box comparison has **zero code** in the repo — no comparison component, no route, and
no entry-point button. It lets a designer switch between a reference and its generated iteration
at identical dimensions, scale, and coordinates.

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

### Comparison view to build

- One fixed viewport box at best-fit scale. The reference screenshot and generated iteration
  occupy identical dimensions, scale, and coordinates.
- One two-position `Source` / `Iteration` toggle. No scrubber, split view, draggable divider,
  highlight toggle, thumbnail strip, or additional comparison control.
- Pixel-diff region highlight (rasterize both frames, diff `ImageData` client-side, zero LLM
  cost — chosen over asking the model to self-report a bounding box, "grading its own homework").
  Still a candidate, independent of the control-model decision above — not ruled out.
- Off-happy-path states: streaming/partial-generation indicator with contextual status text,
  generation-failed entry guard, and a legacy-round fallback when no captured width exists
  (`scale approximate`).
- If the selected direction compiles but fails to mount, `Iteration` shows the generated source
  and exact runtime error inside the fixed box; `Source` continues to show the visual reference.

### Data-model prerequisites for the diff

- **Content-width autocrop** field + confidence flag not yet on the model (only raw natural
  dimensions are).
- **No region/bounding-box concept** exists on `Critique`/`Direction` — feedback doesn't know
  which screen region it targets. The pixel-diff candidate above works around this with
  client-side rasterized diffing rather than model-reported coordinates.
- A user-corrected viewport value and a chain-level locked viewport are not yet modeled.
- Mount-success versus mount-failure needs an explicit comparison-layer state.
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
- **Round-to-round inheritance of goal/context/constraints** — deferred, not a V1 decision.
  Bryan flagged this as a potential macro/historical feature (patterns mined across a project's
  round history) rather than a micro per-round convenience, and wants it scoped on its own later
  rather than decided as a side effect of this doc consolidation.
- **Critique, Directions, and Compare screens against the current gold visual system** — the
  Figma redesign (`docs/design-system.md`) only covers Add-image and Set-the-brief today. The
  rest of the flow still needs a pass in the current direction.

## Resolved behavior and remaining implementation gaps

- Critique is read-only and may be regenerated only before directions exist. The current store
  does not yet enforce that immutability boundary and must clear or lock downstream state.
- Per-direction generation retry is already shipped through `Retry generation`.
- Real-problems and taste items are read-only; changing the evidence requires new feedback and a
  new round once directions exist.
- The lineage view may browse the ordered chain, but comparison remains adjacent: each iteration
  against its direct source. The lineage browsing surface itself has not been designed.
- Later rounds require fresh feedback and use the prior iteration as their reference. Whether
  later rounds also inherit the prior goal, reviewer context, or constraints as editable defaults
  is explicitly deferred, not decided for V1 — see "Other planned-but-not-wired work" below.
- Responsive and touch behavior remains deferred under Decision 13; it is not a blocker or an
  open design input for the current desktop build.
- `Save` and `Export` are two separate actions (primary CTA: Save, secondary CTA: Export), not
  one combined action. Persistence (Save) is shipped; export/download and the final CTA treatment
  are still in progress on the frontend.
- The coquí-call control defaults to muted and remains disabled until an audio asset is supplied.

## Paused: external front-end / UX iteration

Bryan is running **front-end/UX quality passes externally** (outside this repo's automated
pipeline) against the shipped app. DEMO_MODE exists specifically to support these passes with
zero compute cost. Treat visual/UX polish decisions coming out of that work as **incoming**, and
ground any front-end change against the shipped state above — not against older doc snapshots.
