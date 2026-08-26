# Roadmap & Open Work

What is built vs. still open, and what's paused. Grounded in `main` commit `34b7a31`, status
checked 2026-08-26, not in older doc claims.

## Built and shipped (on `main`)

The implemented generation loop is live and persisted:

- Upload + inputs, with **screenshot natural-dimension capture** (`lib/image-dimensions.ts`).
- Claude Sonnet **critique** (signal/preference split + flagged ambiguities).
- Claude Sonnet **directions** (2–3, rationale-backed, optional pattern reference).
- Per-direction **code generation** streamed over SSE into a bottom sheet.
- **Live-mount preview** — generated TSX transpiled with Sucrase and mounted as an interactive
  component in a zero-network sandboxed iframe, with source-view fallbacks.
- **Viewport model** — screenshot dimensions seed the viewport; Bryan can correct the value before
  the first committed iteration, after which the viewport locks for the chain.
- **Fixed-box comparison** — `Source` / `Iteration` is a binary toggle in one registered viewport,
  with source and runtime-error fallbacks when an iteration cannot mount.
- **Source-bundle export** — an approved direction can be downloaded as a standalone bundle.
- **Design-system enforcement** (Geist prompt grounding + deterministic post-processing).
- **Provider fallbacks** — GPT-4o can take over after typed Claude failures when both provider keys
  are configured; 21st.dev grounding uses a live per-round MCP query when its key is configured.
- **DEMO_MODE** fixture replay with write-refusal.
- **Turso round persistence** + a History section reading back recent rounds, chained via
  `previousRoundId`.

> Note on older docs: the "View & State Inventory" and "Findings Log" were written when
> `PreviewFrame` only escaped code into a `<pre>` and no round was ever persisted. Both gaps are
> now **closed** on `main` (PR #7 live-mount + dimension capture; PR #9 Turso persistence). Trust
> the code over those earlier snapshots.

## Remaining precision work

The fixed-box comparison and its viewport lock are shipped. The current viewport model starts
with the screenshot's natural dimensions and accepts a user correction before the chain locks;
it does not yet detect and remove browser chrome or letterboxing from a capture.

- **Content-width autocrop** — a bounded future refinement that could detect the actual interface
  width and attach a confidence flag. It should be added only if real-project validation shows
  that natural dimensions are insufficient.
- **Pixel-diff region highlighting** — remains an optional exploration, not part of the current
  comparison contract. The shipped control is only the binary `Source` / `Iteration` toggle.
- **Legacy rounds** — rounds without captured dimensions continue to use the documented fallback
  behavior rather than inventing a viewport ratio.

## Other planned-but-not-wired work

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
  one combined action. Both behaviors are shipped; final CTA treatment remains subject to
  front-end/UX review.
- The coquí-call control defaults to muted and remains disabled until an audio asset is supplied.

## Paused: external front-end / UX iteration

Bryan is running **front-end/UX quality passes externally** (outside this repo's automated
pipeline) against the shipped app. DEMO_MODE exists specifically to support these passes with
zero compute cost. Treat visual/UX polish decisions coming out of that work as **incoming**, and
ground any front-end change against the shipped state above — not against older doc snapshots.
