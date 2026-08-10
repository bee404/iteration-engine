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

### Comparison view states still to build (from the blueprint)

- Unified comparison frame at best-fit scale (single frame, not two shrunk side-by-side).
- Controls: **Before / Split / After** segmented control, draggable divider (`clip-path` + range
  input), **Highlight on/off** toggle, **Scale: fit**.
- Pixel-diff region highlight (rasterize both frames, diff `ImageData` client-side, zero LLM
  cost — chosen over asking the model to self-report a bounding box, "grading its own homework").
- Off-happy-path states: streaming/partial-generation indicator (partial-height, contextual
  status text — *not* full raw code), generation-failed entry guard, legacy-round fallback (no
  captured width → default width, "scale approximate"), and the **whole-frame / rasterization-
  unreliable fallback** — surface the direction's own `rationale` + `suggestedChanges` rather
  than a bare "substantially restructured" label.

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

## Paused: external front-end / UX iteration

Bryan is running **front-end/UX quality passes externally** (outside this repo's automated
pipeline) against the shipped app. DEMO_MODE exists specifically to support these passes with
zero compute cost. Treat visual/UX polish decisions coming out of that work as **incoming**, and
ground any front-end change against the shipped state above — not against older doc snapshots.

