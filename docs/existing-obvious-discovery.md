# Existing Obvious Discovery

## Purpose

Record Obvious's current understanding of the product, including its purpose, audience, problem, workflow, outputs, technical thinking, open questions, and expected release shape.

## Status

Recovered from Obvious's prior blueprint work (art_ehqZ4FWU, art_qAlAuxpv, art_RfGXZUl6). This is a snapshot of the pre-reconciliation position — do not edit it to reflect new decisions. New decisions belong in `decisions.md`; the reconciled direction belongs in `blueprint.md`.

## Discovery summary

### The problem

Bryan (Founder & Design Lead, Obsidian53) runs 4-5 rounds of design iteration per view, across up to 4 initiatives in flight at once. Iteration currently means manually re-doing visual/prototype work every time stakeholder feedback comes in. The loop between feedback and a reviewable next version is slow and manual.

### Target user

Bryan himself. This is a personal, internal productivity tool — not stakeholder-facing. Bryan takes the tool's output to stakeholders; stakeholders never touch the tool directly.

### Product purpose (as previously scoped)

Automate the loop from screenshot + stakeholder feedback to a reviewable HTML/CSS (React+CSS preferred) prototype, so Bryan can iterate faster without manually rebuilding each version by hand.

### Core workflow (as previously scoped)

1. Bryan uploads screenshot(s) and pastes feedback text (single view, or multiple screenshots plus a flowchart screenshot for a connected workflow).
2. System classifies single-view vs. multi-screen workflow.
3. System analyzes feedback for vagueness ("make it more modern" flagged; specific requests pass through).
4. If feedback is vague: if ComfyUI is running locally, generate 2-3 visual style variations (img2img, denoise 0.5, ControlNet-preserved layout) and let Bryan pick a direction; if ComfyUI is unavailable, ask Bryan to clarify in text instead.
5. System sends screenshot + feedback + design tokens + style guide to Claude Sonnet (GPT-4o fallback on validation failure) to generate one new prototype version. Streams via SSE to a sandboxed preview iframe.
6. Bryan reviews the live prototype and either approves or requests further changes (loops back to step 3).
7. On approval, the iteration is saved to Turso (code snapshot, feedback that drove it, diff from previous version). Bryan can export the approved prototype as a downloadable bundle.

### Input model

- Screenshot(s) — the dominant source visual; Figma links are rare and not required.
- Feedback text — a mix of vague and specific; vague portions are flagged before generation, not guessed at.
- Design tokens — W3C DTCG JSON format, compiled to a compressed JSON index for LLM prompting; code is the source of truth, Figma mirrors it.
- Condensed style guide — a short markdown reference of component/layout conventions.
- Flowchart screenshot (multi-screen only) — a rudimentary flowchart read by the vision LLM alongside the screenshots, no structured parsing format.

### Output model

- One generated HTML/CSS (or React) prototype per round, streamed live to a sandboxed preview iframe.
- An approved iteration record: code snapshot + the feedback that drove it + a diff from the previous version, persisted in Turso.
- A downloadable export bundle of the approved prototype.
- No standalone critique artifact; feedback analysis (vague/specific classification) is an internal gating step, not a delivered output.

### Product principles (as previously scoped)

- Every iteration requires Bryan's explicit approval before it's treated as final.
- Vague feedback is flagged and clarified before generation — never silently guessed at.
- The tool is modular and agnostic: not tied to any specific product, brand, or technology.
- Code is the source of truth for the design system; Figma mirrors it, not the reverse.
- Global default project config, overridable per project.

### Role of AI

Generate the next prototype version directly from screenshot + feedback + design system context. Flag vague feedback before generating. Fall back to GPT-4o if the primary model's output fails validation.

### Role of the designer (Bryan)

Provide feedback, clarify vague requests, review every generated prototype, and approve or reject each round. Bryan is the sole approval gate.

### Technical architecture

- **App**: Next.js, deployed to Vercel Hobby (free tier: 100GB bandwidth, 1M invocations, 4 CPU-hrs/mo, 60s function timeout).
- **State**: Zustand.
- **Persistence**: Turso (SQLite on the edge, free tier), replacing local SQLite because Vercel's filesystem is ephemeral.
- **Generation engine**: Claude Sonnet (primary) — benchmarked ahead of GPT-4o on screenshot-to-code tasks (70.31% vs 65.10% on the abi/screenshot-to-code eval); GPT-4o as fallback on validation failure.
- **Visual pre-iteration / asset generation**: ComfyUI, running locally on Bryan's machine (port 8188), optional, health-checked via `GET /system_stats`.
- **Preview**: sandboxed iframe within the Next.js app.
- **Secrets**: Vercel server-only environment variables; `.env.local` for local dev (gitignored).
- **Design tokens**: W3C DTCG JSON, compiled to a compressed JSON index for prompting; CSS custom properties for prototype runtime use.

### Likely integrations

- ComfyUI (local, optional) for visual pre-iteration and asset generation.
- Figma, only as an occasional source of screenshots.

### Intended release shape

- Standalone web app, personal/internal tool, not stakeholder-facing.
- V1 scope: single-screen generation only, with an architecture designed to extend to multi-screen sequential generation later.

### Success criteria

Not explicitly defined as measurable criteria in the prior discovery. Only usage-volume assumptions were captured (4-5 rounds per view, up to 4 initiatives, up to 10 screens) — describing expected load, not a definition of "the tool is working." This was a gap the reconciliation closed (see `decisions.md`).

### Unresolved questions (as of the prior blueprint)

All five open questions raised during the original discovery were resolved before this reconciliation began: flowchart parsing (screenshot input), multi-screen strategy (sequential, v1 single-screen only), prototype hosting (sandboxed iframe), API key management (Vercel server-only env vars), state persistence (Turso).
