# Roadmap & Open Work

What is built vs. still open, and what's paused. Grounded in `codex/v0-portable-prototype`, status checked 2026-08-26.

## Built and shipped (on `main`)

The canonical generation loop is live and transient:

- Upload + inputs, with **screenshot natural-dimension capture** (`lib/image-dimensions.ts`).
- Claude Sonnet **critique** (signal/preference split + flagged ambiguities).
- Claude Sonnet **directions** (2–3, rationale-backed, optional pattern reference).
- Selected-direction **code generation** streamed over SSE into the prototype stage.
- **Live-mount preview** — generated TSX transpiled with Sucrase and mounted as an interactive
  component in a zero-network sandboxed iframe, with source-view fallbacks.
- **Viewport model** — screenshot dimensions seed the viewport; Bryan can correct the value before
  prototype generation, after which the viewport locks for that exploration.
- **Fixed-box comparison** — `Source` / `Iteration` is a binary toggle in one registered viewport,
  with source and runtime-error fallbacks when an iteration cannot mount.
- **Context-rich export** — runnable Vite/React source downloads with raw inputs, synthesized critique, full selected direction, viewport, and generation notes.
- **Design-system enforcement** (Geist prompt grounding + deterministic post-processing).
- **Provider fallbacks** — GPT-4o can take over after typed Claude failures when both provider keys
  are configured; 21st.dev grounding uses a live per-round MCP query when its key is configured.
- **DEMO_MODE** fixture replay with no external model calls.
- **No screenshot retention or history in V0** — exploration state is in-memory and the screenshot is excluded from the ZIP by default.

> Note on older docs: the "View & State Inventory" and "Findings Log" predate the live-mount preview and current V0 product decision. Trust the current code and Decision 17 over those snapshots.

## Remaining precision work

The fixed-box comparison and its viewport lock are shipped. The current viewport model starts
with the screenshot's natural dimensions and accepts a user correction before the exploration locks;
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
- **Historical record / lineage** — a future retention enhancement that becomes valuable when the product can show what was selected in each exploration. A future way to browse a chain's full history is a candidate signature
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
- Any future lineage view must preserve adjacent source/iteration comparison. No lineage surface is part of V0.
- Later rounds require fresh feedback and use the prior iteration as their reference. Whether
  later rounds also inherit the prior goal, reviewer context, or constraints as editable defaults
  is explicitly deferred, not decided for V1 — see "Other planned-but-not-wired work" below.
- Responsive and touch behavior remains deferred under Decision 13; it is not a blocker or an
  open design input for the current desktop build.
- `Download prototype` is the final primary action. `Start another exploration` clears transient state and returns to upload.
- The coquí-call control defaults to muted and remains disabled until an audio asset is supplied.

## Paused: external front-end / UX iteration

Bryan is running **front-end/UX quality passes externally** (outside this repo's automated
pipeline) against the shipped app. DEMO_MODE exists specifically to support these passes with
zero compute cost. Treat visual/UX polish decisions coming out of that work as **incoming**, and
ground any front-end change against the shipped state above — not against older doc snapshots.
