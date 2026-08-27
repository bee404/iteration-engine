# Release Plan

## Purpose

Define an achievable release shape, sequencing, validation approach, and delivery constraints derived from the approved product blueprint.

## Status

Agreed 2026-08-05, reconciled with the shipped system and cross-tool context packets on 2026-08-11. Implementation status last checked against `main` on 2026-08-27. Derived from `docs/blueprint.md`, `docs/decisions.md`, and the implementation status in `docs/knowledge-base/roadmap-and-open-work.md`.

### Implementation status as of 2026-08-26

Implemented on `main`: screenshot intake and natural-dimension capture; real Claude critique and direction generation; selected-direction streamed code generation; live-mount preview with source fallback; per-exploration viewport inference, correction, and locking; fixed-box `Source` / `Iteration` comparison; and a client-generated ZIP containing runnable source plus the full exploration context. The canonical V0 flow is transient and does not persist screenshots, approvals, or history.

Remaining for V1: validate the complete loop against a real project and evaluate whether content-width autocrop plus a confidence flag is needed beyond the current natural-dimension viewport model. Optional ComfyUI clarification remains a graceful enhancement, not a blocker for the core comparison loop.

## Plan

### What v1 must prove

Per Bryan's own guidance for this reconciliation: don't optimize solely for a demo, and don't shrink scope before knowing what the release needs to prove. V1's job is to prove the judgment-first loop actually works end-to-end on a real screen: critique that separates signal from preference, 2-3 directions that are genuinely different (not shallow variation), and a coherent `Source` / `Iteration` comparison Bryan can act on. Everything else is secondary to that loop.

### In scope for v1

- Single-screen rounds (upload screenshot, design goal, feedback, optional reviewer context/constraints).
- Critique generation (Claude Sonnet) separating signal from preference.
- 2-3 direction generation per round, each with rationale and tradeoffs.
- Live 21st.dev MCP queries for pattern grounding on direction generation.
- Vague-feedback flagging and clarification (text-based; ComfyUI visual clarification if available locally).
- Code/prototype generation for the selected direction (Claude Sonnet primary, GPT-4o fallback), streamed via SSE to a sandboxed preview iframe.
- Fixed-box `Source` / `Iteration` comparison (the generated iteration against its direct source).
- Portable prototype export with runnable source, raw inputs, synthesized critique, complete selected direction, viewport, generation notes, and completed-run provider/model provenance.

### Explicitly out of scope for v1 (deferred, not rejected)

- Multi-screen workflows (up to 10 screens, shared context) — architecture should not preclude this, but it is not built in v1.
- Historical rounds, screenshot hosting, approval state, lineage, and retention features.
- Comparing directions across multiple rounds as a dedicated view beyond basic version history (the within-round comparison is v1; a richer cross-round comparison view can follow).
- A paid 21st.dev tier — start on the free tier (2 code-retrievals/day); revisit only if usage hits that ceiling.
- Any Higgsfield or additional generation-layer integration.
- Any runtime dependency on Obvious.

### Validation approach

Validated against Decision 7's success bar: run v1 on at least one real Obsidian53 screen. Success is judged qualitatively by Bryan — is the critique respectful of what he gave it, is at least one direction genuinely different and worth pursuing, and does the `Source` / `Iteration` comparison give him something actionable to take to stakeholders. This is a per-round bar, not a statistical one; it's expected to get sharper as Bryan uses the tool more.

### Remaining sequence

1. Run the complete V1 loop on at least one real project and evaluate it against Decision 7's coherence bar.
2. If real-project validation exposes registration or cropping problems, add content-width autocrop and a confidence flag as a bounded refinement.
3. Add ComfyUI-based visual clarification only if it materially improves ambiguous-feedback cases after the core loop is proven.

### Risks

- 21st.dev's free-tier 2/day code-retrieval cap could bottleneck iteration during heavy build/test days — mitigated by the fact that search/metadata (used for grounding) is unmetered; only literal code retrieval is capped.
- Claude Sonnet costs include one code generation per completed exploration; the selected-direction gate keeps this bounded.
- No explicit multi-screen support in v1 could limit real-world use for larger initiatives — accepted tradeoff, architecture is designed not to preclude the extension later.

### Next decision point

Once v1 has run on at least one real project, revisit: whether the 2-3 directions target needs to flex, whether a paid 21st.dev tier is warranted, and how the success bar should evolve for v2.
