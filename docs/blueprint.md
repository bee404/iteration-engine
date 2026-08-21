# Product Blueprint

## Purpose

Define the agreed product direction after the discovery differences and consequential product decisions were resolved.

## Status

Agreed 2026-08-05. This is the current source of truth for what the product is. See `docs/decisions.md` for the rationale behind each choice and `docs/release-plan.md` for how it ships.

**Naming note (2026-08-11):** the product was renamed **Coquí** (formerly "Iteration Engine") — see Decision 8 in `docs/decisions.md`. Historical discovery snapshots retain the old name; current product documentation and surfaces use Coquí. Visual identity, brand, and copy voice live in `docs/design-system.md`.

## Blueprint

### What it is

A personal design-iteration tool for Bryan (Founder & Design Lead, Obsidian53). Each round takes a screenshot, a design goal, and feedback, and returns a critique plus several genuinely different directions with rationale — not a single auto-regenerated prototype. Code/prototype generation is available on demand for any direction, at any time, but is never a required step. The designer always chooses; the tool never finalizes anything on its own.

### Who it's for

Bryan only. Internal, not stakeholder-facing — Bryan takes the tool's output to stakeholders himself.

### Product principles

- The designer remains responsible for selecting directions, evaluating quality, applying taste, and deciding what advances. AI is never the final decision-maker.
- The system should avoid producing shallow visual variation that looks different but doesn't represent a genuinely different design decision.
- Vague feedback is flagged and clarified before generation — never silently guessed at.
- Code/prototype generation is an on-demand fidelity step, not a mandatory pipeline stage.
- The tool is modular and agnostic: not tied to any specific product, brand, or technology.
- For design systems supplied to Coquí to constrain generated prototypes, code and tokens are the source of truth and Figma mirrors them. For Coquí's own application shell, root `DESIGN.md` is authoritative and the current Figma file is the visual reference. Do not conflate the two systems.
- **Convergence over exploration.** Every surface guides toward one answer per round — this is the load-bearing positioning call, not up for redesign. There is no branching, forking, merging, or version graph in the product (see Decision 12); a person can look at an unselected direction without committing to it.
- **Perfect registration is the payoff.** Everything a round produces — the original screenshot and every later iteration — renders into one identical, fixed viewport box, inferred once per chain (not once per round). This is what makes the `Source` / `Iteration` comparison trustworthy: nothing shifts under the eye between reference and iteration.
- **Every judgment is cited.** Critique items state their reasoning; directions additionally point to a real named external pattern (21st.dev), not an invented layout.
- **Failures degrade, they never disappear.** Code that compiles but fails to mount falls back to source plus the raw runtime error — never a blank frame or a generic error state.
- **History is a stack of aligned layers**, not a changelog, thumbnail strip, or timeline row — those forms discard registration, the one property this product is built around.

### Terminology

Use these words consistently, in this product-specific sense, across docs and UI copy: **reference**
(the screenshot or prior iteration a round starts from), **viewport box** (the fixed, inferred
render target every visual in a chain shares), **goal**, **feedback**, **critique**, **real
problems** (critique's signal pile), **taste** (critique's preference pile), **direction**,
**grounding** (the external pattern a direction cites), **iteration**, **round**, **lineage**,
**chain**.

### Core workflow

1. Bryan uploads a screenshot (plus an optional flowchart screenshot for multi-screen context), states a design goal, and provides raw feedback — optionally with reviewer perspective/context and additional references or constraints.
2. The system produces a concise critique of the current design: it separates signal (real problems) from preference (taste), grounded in the stated goal and feedback.
3. If feedback contains vague or ambiguous portions the critique can't resolve on its own, the system flags them. Bryan clarifies in text, or — if ComfyUI is running locally — reviews 2-3 auto-generated visual style variations (img2img, denoise 0.5, ControlNet-preserved layout) to pick a direction before proceeding.
4. The system generates 2-3 meaningfully different iteration directions. Each includes a rationale, tradeoffs, and suggested design changes, and — when relevant — a reference to a comparable layout or pattern pulled live from 21st.dev to ground the direction in a known solution rather than inventing from scratch.
5. Bryan reviews the critique and directions against the round's reference. For any direction — zero, one, or several, at any point, whether or not it's been chosen — Bryan can request full code/prototype generation (Claude Sonnet primary, GPT-4o fallback) as an on-demand fidelity step.
6. Any generated code streams live via SSE to a sandboxed preview iframe. Bryan interacts with it and either requests more changes (loop back to step 3) or approves it.
7. On approval, the round — critique, directions, rationale, any generated code, and the feedback that drove it — is saved to Turso and linked to its direct source in the ordered chain. Bryan can compare the approved iteration with that source and export the prototype as a downloadable source bundle.

### Facts that constrain the workflow's design

- **Round one and round N are structurally different.** Round one has a file picker; every later round in the same chain does not — the reference is already in the system (the prior iteration).
- **The viewport box is inferred once per chain**, not once per round — see the Perfect registration principle above.
- **The feedback field is the heaviest typing burden and the least predictable in length.** Design for pasted Slack threads and comment dumps, not just short one-line notes.
- **Three model calls sit on the critical path** (critique, directions, code generation), and the longest of them lands immediately after the one required decision per round.
- **Only one decision is required per round: which direction.** Everything else is optional or is reading.
- **The directions stage is the densest moment in the flow**, by a wide margin — give it the most visual priority.
- **Code generation has three outcomes, not two:** fails outright; compiles and mounts; or compiles but fails to mount, in which case the tool degrades to the source view plus the raw runtime error (see the Failures-degrade principle above).

### Input model

- Screenshot(s) — the dominant source visual; Figma links are rare and not required.
- Design goal — what this round is trying to achieve (new, explicit field).
- Raw feedback — a mix of vague and specific; vague portions are flagged before generation.
- Optional reviewer perspective/context — who gave the feedback and from what angle (new, explicit field).
- Optional additional references, requirements, or constraints.
- Design tokens (W3C DTCG JSON, compiled to a compressed JSON index) and a condensed style guide for the product being iterated — its code and tokens remain the source of truth. This input system is separate from Coquí's own UI tokens in root `DESIGN.md`.
- Optional flowchart screenshot for multi-screen workflows, read by the vision LLM.

### Output model

- A concise critique of the current design (signal vs. preference).
- 2-3 directions, each with rationale, tradeoffs, and suggested changes, optionally grounded in a 21st.dev pattern reference.
- Optional, on-demand full code/prototype generation for any direction, streamed live to a sandboxed preview.
- A fixed-box comparison between a generated iteration and its direct source, plus an ordered lineage for browsing rounds over time. No arbitrary node-to-node comparison or branching UI.
- An approved-iteration record (critique + directions + any code + driving feedback) persisted in Turso; approved prototypes are exportable as a downloadable bundle.

### Technical architecture

- **App**: Next.js, deployed to Vercel Hobby (free tier covers expected usage; 60s function timeout is sufficient for Claude Sonnet calls).
- **State**: Zustand.
- **Persistence**: Turso (SQLite on the edge) — iteration history, directions, critiques, project configs, generated code snapshots.
- **Critique and direction generation**: Claude Sonnet (primary), GPT-4o as fallback on validation failure.
- **Pattern grounding**: live MCP queries to 21st.dev (`https://21st.dev/api/mcp`) under Bryan's own API key, at generation time only — no local mirror of their taxonomy, per their Terms of Service.
- **Visual pre-iteration / asset generation**: ComfyUI, running locally on Bryan's machine (port 8188), optional, health-checked via `GET /system_stats`; the system degrades to LLM-only when it's not running.
- **Preview**: sandboxed iframe within the Next.js app, SSE streaming for generated code.
- **Secrets**: Vercel server-only environment variables; `.env.local` for local dev (gitignored).
- **Access**: live production is single-user and credential-gated; missing credentials fail closed. Public fixture demos remain open because they cannot call providers or write persistence.
- **Input boundary**: screenshots are browser-uploaded image data URLs only, with a 3 MB decoded-size cap; arbitrary server-side URL fetching is prohibited.
- **Generated-code boundary**: preview iframes combine sandboxing with a network-closed Content Security Policy.
- **Abuse controls**: model endpoints have per-instance burst limits and structured security-event logs; Vercel Firewall provides the distributed traffic layer and alerting.
- **Orchestration**: fully standalone — no runtime dependency on Obvious.

### V1 scope

Single-screen rounds only. The data model and generation endpoints are designed to extend to multi-screen sequential generation (up to 10 screens, shared design context) later, but that extension is explicitly out of v1. See `docs/release-plan.md` for the full v1 boundary.

### Success criteria

V1 succeeds when a round's output is coherent: respectful of the inputs Bryan gave it, synthesizing feedback into an established direction, and producing a visual output Bryan can review as a clear `Source` / `Iteration` comparison against that round's direct source. Refinement continues iteratively past this bar — see `docs/decisions.md`, Decision 7.

### Resolved workflow details

- Each direction owns its `Generate code (optional)` action and generated-code preview.
- Use the free 21st.dev tier until real usage reaches its retrieval limit; only then consider a paid tier.
- The v1 success bar remains per-round coherence. A longitudinal metric is not required before real usage provides evidence for one.
- Show the inferred viewport dimensions before the first synthesis. Bryan can correct them before committing the first iteration; the viewport box then locks for the chain.
- A later round uses the prior iteration as its reference and requires fresh feedback. Whether it also inherits the prior goal, reviewer context, and constraints as editable defaults is deferred (see `docs/decisions.md`, Decision 14, and `docs/knowledge-base/roadmap-and-open-work.md`).
- Critique items are read-only. Regeneration is allowed only before directions exist; after that, changed feedback starts a new immutable round.
- Code generation can be retried for the same direction after failure.
- On a compile-success/mount-failure result, `Iteration` shows the generated source and exact runtime error inside the fixed viewport box. `Source` still shows the visual reference.
- `Save` and `Export` are two separate actions, not one combined action: Save (primary CTA) persists the approved round; Export (secondary CTA) downloads the approved prototype as a source bundle. Persistence is shipped; export/download and the final CTA treatment remain in progress.
- Comparison is adjacent by design: each iteration against its direct source. The lineage view may browse the full chain but does not become an arbitrary node-to-node comparison or branching interface.
