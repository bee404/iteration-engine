# Product Blueprint

## Purpose

Define the agreed product direction after the discovery differences and consequential product decisions were resolved.

## Status

Agreed 2026-08-05. This is the current source of truth for what the product is. See `docs/decisions.md` for the rationale behind each choice and `docs/release-plan.md` for how it ships.

**Naming note (2026-08-11):** the product was renamed **Coquí** (formerly "Iteration Engine") — see Decision 8 in `docs/decisions.md`. Historical discovery snapshots retain the old name; current product documentation and surfaces use Coquí. Visual identity, brand, and copy voice live in `docs/design-system.md`.

## Blueprint

### What it is

A personal design-exploration tool for Bryan (Founder & Design Lead, Obsidian53). Each exploration takes a screenshot, a design goal, and feedback; returns a critique plus several genuinely different rationale-backed directions; and turns the designer's selected direction into a downloadable coded prototype. Selection is not formal approval. The designer always chooses; the tool never finalizes anything on its own.

### Who it's for

Bryan only. Internal, not stakeholder-facing — Bryan takes the tool's output to stakeholders himself.

### Product principles

- The designer remains responsible for selecting directions, evaluating quality, applying taste, and deciding what advances. AI is never the final decision-maker.
- The system should avoid producing shallow visual variation that looks different but doesn't represent a genuinely different design decision.
- Vague feedback is flagged and clarified before generation — never silently guessed at.
- Code/prototype generation follows the one required direction selection and makes the exploration tangible.
- The tool is modular and agnostic: not tied to any specific product, brand, or technology.
- For design systems supplied to Coquí to constrain generated prototypes, code and tokens are the source of truth and Figma mirrors them. For Coquí's own application shell, root `DESIGN.md` is authoritative and the current Figma file is the visual reference. Do not conflate the two systems.
- **Bounded exploration.** The product presents a small set of alternatives, then asks the designer which one is worth prototyping. There is no branching, forking, merging, or version graph in V0.
- **Perfect registration is the payoff.** The original screenshot and generated iteration render into one identical, fixed viewport box. This makes the `Source` / `Iteration` comparison trustworthy.
- **Every judgment is cited.** Critique items state their reasoning; directions additionally point to a real named external pattern (21st.dev), not an invented layout.
- **Failures degrade, they never disappear.** Code that compiles but fails to mount falls back to source plus the raw runtime error — never a blank frame or a generic error state.
- **The durable artifact belongs to the user.** V0 ends in a context-rich download instead of retaining screenshots or round history on Coquí's server.

### Terminology

Use these words consistently, in this product-specific sense, across docs and UI copy: **reference**
(the screenshot an exploration starts from), **viewport box** (the fixed, inferred
render target the source and prototype share), **goal**, **feedback**, **critique**, **real
problems** (critique's signal pile), **taste** (critique's preference pile), **direction**,
**grounding** (the external pattern a direction cites), **iteration**, **exploration**, **prototype**,
and **download payload**.

### Core workflow

1. Bryan uploads a screenshot (plus an optional flowchart screenshot for multi-screen context), states a design goal, and provides raw feedback — optionally with reviewer perspective/context and additional references or constraints.
2. The system produces a concise critique of the current design: it separates signal (real problems) from preference (taste), grounded in the stated goal and feedback.
3. If feedback contains vague or ambiguous portions the critique can't resolve on its own, the system flags them. Bryan clarifies in text, or — if ComfyUI is running locally — reviews 2-3 auto-generated visual style variations (img2img, denoise 0.5, ControlNet-preserved layout) to pick a direction before proceeding.
4. The system generates 2-3 meaningfully different iteration directions. Each includes a rationale, tradeoffs, and suggested design changes, and — when relevant — a reference to a comparable layout or pattern pulled live from 21st.dev to ground the direction in a known solution rather than inventing from scratch.
5. Bryan selects the direction worth exploring and chooses **Continue to prototype**.
6. Code for that direction streams live via SSE to a sandboxed preview iframe. Bryan reviews it against the source in the fixed viewport and can retry a failed generation.
7. Bryan chooses **Download prototype**. The browser creates a runnable Vite/React ZIP plus `coqui-context.json` containing the raw inputs, synthesized critique, selected direction, viewport, generation notes, and the provider/model that actually completed generation. The screenshot is not included by default and no exploration history is persisted in V0.

### Facts that constrain the workflow's design

- **Each V0 exploration starts with a file picker.** Starting another exploration resets the in-memory state.
- **The viewport box is inferred once per exploration** and locks when prototype generation begins.
- **The feedback field is the heaviest typing burden and the least predictable in length.** Design for pasted Slack threads and comment dumps, not just short one-line notes.
- **Three model calls sit on the critical path** (critique, directions, code generation), and the longest of them lands immediately after the one required decision per round.
- **Only one decision is required per exploration: which direction.**
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
- Full code/prototype generation for the selected direction, streamed live to a sandboxed preview.
- A fixed-box comparison between the generated iteration and its direct source.
- A client-generated ZIP containing runnable source and a structured record of the inputs, critique, selected direction, viewport, generation notes, and completed-run provider/model provenance. The screenshot is excluded by default.

### Technical architecture

- **App**: Next.js, deployed to Vercel Hobby (free tier covers expected usage; 60s function timeout is sufficient for Claude Sonnet calls).
- **State**: Zustand.
- **Exploration state**: transient Zustand state in the browser for V0. Historical persistence is deferred.
- **Critique and direction generation**: Claude Sonnet (primary), GPT-4o as fallback on validation failure.
- **Pattern grounding**: live MCP queries to 21st.dev (`https://21st.dev/api/mcp`) under Bryan's own API key, at generation time only — no local mirror of their taxonomy, per their Terms of Service.
- **Visual pre-iteration / asset generation**: ComfyUI, running locally on Bryan's machine (port 8188), optional, health-checked via `GET /system_stats`; the system degrades to LLM-only when it's not running.
- **Preview**: sandboxed iframe within the Next.js app, SSE streaming for generated code.
- **Secrets**: Vercel server-only environment variables; `.env.local` for local dev (gitignored).
- **Access**: live production is single-user and credential-gated; missing credentials fail closed. Public fixture demos remain open because they cannot call providers.
- **Input boundary**: screenshots are browser-uploaded image data URLs only, with a 3 MB decoded-size cap; arbitrary server-side URL fetching is prohibited.
- **Generated-code boundary**: preview iframes combine sandboxing with a network-closed Content Security Policy.
- **Abuse controls**: model endpoints have per-instance burst limits and structured security-event logs; Vercel Firewall provides the distributed traffic layer and alerting.
- **Orchestration**: fully standalone — no runtime dependency on Obvious.

### V1 scope

Single-screen explorations only. Multi-screen workflows and historical records are explicitly deferred. See `docs/release-plan.md` for the full V0 boundary.

### Success criteria

V1 succeeds when a round's output is coherent: respectful of the inputs Bryan gave it, synthesizing feedback into an established direction, and producing a visual output Bryan can review as a clear `Source` / `Iteration` comparison against that round's direct source. Refinement continues iteratively past this bar — see `docs/decisions.md`, Decision 7.

### Resolved workflow details

- The selected direction advances through `Continue to prototype`; code generation begins immediately.
- Use the free 21st.dev tier until real usage reaches its retrieval limit; only then consider a paid tier.
- The v1 success bar remains per-round coherence. A longitudinal metric is not required before real usage provides evidence for one.
- Show the inferred viewport dimensions before synthesis. Bryan can correct them before generation; the viewport box then locks for that exploration.
- Critique items are read-only. Regeneration is allowed only before directions exist; after that, changed feedback starts a new immutable round.
- Code generation can be retried for the same direction after failure.
- On a compile-success/mount-failure result, `Iteration` shows the generated source and exact runtime error inside the fixed viewport box. `Source` still shows the visual reference.
- `Download prototype` is the final primary action. `Start another exploration` resets transient state and returns to upload.
- Historical rounds and an explicit commit/approval state are future progressive enhancements, not V0 concepts.
