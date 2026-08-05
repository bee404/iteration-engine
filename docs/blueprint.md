# Product Blueprint

## Purpose

Define the agreed product direction after the discovery differences and consequential product decisions were resolved.

## Status

Agreed 2026-08-05. This is the current source of truth for what Iteration Engine is. See `docs/decisions.md` for the rationale behind each choice and `docs/release-plan.md` for how it ships.

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
- Code is the source of truth for the design system; Figma mirrors it, not the reverse.

### Core workflow

1. Bryan uploads a screenshot (plus an optional flowchart screenshot for multi-screen context), states a design goal, and provides raw feedback — optionally with reviewer perspective/context and additional references or constraints.
2. The system produces a concise critique of the current design: it separates signal (real problems) from preference (taste), grounded in the stated goal and feedback.
3. If feedback contains vague or ambiguous portions the critique can't resolve on its own, the system flags them. Bryan clarifies in text, or — if ComfyUI is running locally — reviews 2-3 auto-generated visual style variations (img2img, denoise 0.5, ControlNet-preserved layout) to pick a direction before proceeding.
4. The system generates 2-3 meaningfully different iteration directions. Each includes a rationale, tradeoffs, and suggested design changes, and — when relevant — a reference to a comparable layout or pattern pulled live from 21st.dev to ground the direction in a known solution rather than inventing from scratch.
5. Bryan reviews the critique and directions against the original. For any direction — zero, one, or several, at any point, whether or not it's been chosen — Bryan can request full code/prototype generation (Claude Sonnet primary, GPT-4o fallback) as an on-demand fidelity step.
6. Any generated code streams live via SSE to a sandboxed preview iframe. Bryan interacts with it and either requests more changes (loop back to step 3) or approves it.
7. On approval, the round — critique, directions, rationale, any generated code, and the feedback that drove it — is saved to Turso, including a comparison against the original and against prior rounds. Bryan can export any approved prototype as a downloadable bundle.

### Input model

- Screenshot(s) — the dominant source visual; Figma links are rare and not required.
- Design goal — what this round is trying to achieve (new, explicit field).
- Raw feedback — a mix of vague and specific; vague portions are flagged before generation.
- Optional reviewer perspective/context — who gave the feedback and from what angle (new, explicit field).
- Optional additional references, requirements, or constraints.
- Design tokens (W3C DTCG JSON, compiled to a compressed JSON index) and a condensed style guide — code remains the source of truth for the design system.
- Optional flowchart screenshot for multi-screen workflows, read by the vision LLM.

### Output model

- A concise critique of the current design (signal vs. preference).
- 2-3 directions, each with rationale, tradeoffs, and suggested changes, optionally grounded in a 21st.dev pattern reference.
- Optional, on-demand full code/prototype generation for any direction, streamed live to a sandboxed preview.
- A comparison view spanning two axes: multiple directions against the original within a round, and versions across rounds over time.
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
- **Orchestration**: fully standalone — no runtime dependency on Obvious.

### V1 scope

Single-screen rounds only. The data model and generation endpoints are designed to extend to multi-screen sequential generation (up to 10 screens, shared design context) later, but that extension is explicitly out of v1. See `docs/release-plan.md` for the full v1 boundary.

### Success criteria

V1 succeeds when a round's output is coherent: respectful of the inputs Bryan gave it, synthesizing feedback into an established direction, producing a visual output Bryan can review as a clear before/after comparison against the original. Refinement continues iteratively past this bar — see `docs/decisions.md`, Decision 7.

### Open questions

- Exact UI mechanism for triggering on-demand code generation per direction (build-time detail).
- Whether a paid 21st.dev tier is needed once real usage against the free tier's 2/day code-retrieval cap is known.
- How success criteria evolve once the tool is used on real Obsidian53 projects.
