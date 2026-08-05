# Release Plan

## Purpose

Define an achievable release shape, sequencing, validation approach, and delivery constraints derived from the approved product blueprint.

## Status

Agreed 2026-08-05, derived from `docs/blueprint.md` and `docs/decisions.md`.

## Plan

### What v1 must prove

Per Bryan's own guidance for this reconciliation: don't optimize solely for a demo, and don't shrink scope before knowing what the release needs to prove. V1's job is to prove the judgment-first loop actually works end-to-end on a real screen: critique that separates signal from preference, 2-3 directions that are genuinely different (not shallow variation), and a coherent before/after comparison Bryan can act on. Everything else is secondary to that loop.

### In scope for v1

- Single-screen rounds (upload screenshot, design goal, feedback, optional reviewer context/constraints).
- Critique generation (Claude Sonnet) separating signal from preference.
- 2-3 direction generation per round, each with rationale and tradeoffs.
- Live 21st.dev MCP queries for pattern grounding on direction generation.
- Vague-feedback flagging and clarification (text-based; ComfyUI visual clarification if available locally).
- On-demand code/prototype generation for any direction (Claude Sonnet primary, GPT-4o fallback), streamed via SSE to a sandboxed preview iframe.
- Before/after comparison view (original vs. selected direction's output).
- Turso persistence of rounds (critique, directions, any generated code, driving feedback).
- Approved-prototype export as a downloadable bundle.

### Explicitly out of scope for v1 (deferred, not rejected)

- Multi-screen workflows (up to 10 screens, shared context) — architecture should not preclude this, but it is not built in v1.
- Comparing directions across multiple rounds as a dedicated view beyond basic version history (the within-round comparison is v1; a richer cross-round comparison view can follow).
- A paid 21st.dev tier — start on the free tier (2 code-retrievals/day); revisit only if usage hits that ceiling.
- Any Higgsfield or additional generation-layer integration.
- Any runtime dependency on Obvious.

### Validation approach

Validated against Decision 7's success bar: run v1 on at least one real Obsidian53 screen. Success is judged qualitatively by Bryan — is the critique respectful of what he gave it, is at least one direction genuinely different and worth pursuing, and does the before/after comparison give him something actionable to take to stakeholders. This is a per-round bar, not a statistical one; it's expected to get sharper as Bryan uses the tool more.

### Sequencing

1. Input capture + critique generation (Claude Sonnet), no directions yet — validates the signal-vs-preference separation in isolation.
2. Direction generation (2-3 directions, rationale, tradeoffs) layered on top, with live 21st.dev grounding.
3. On-demand code generation for a chosen direction, streamed to the sandboxed preview.
4. Turso persistence + before/after comparison view.
5. Vague-feedback flagging and the ComfyUI-based visual clarification path (can land after the core loop is proven, since it only affects the harder subset of feedback).

### Risks

- 21st.dev's free-tier 2/day code-retrieval cap could bottleneck iteration during heavy build/test days — mitigated by the fact that search/metadata (used for grounding) is unmetered; only literal code retrieval is capped.
- Claude Sonnet costs scale with directions-per-round; 2-3 directions with rationale-only (no code) keeps this bounded, since code generation is on-demand and per-direction, not automatic.
- No explicit multi-screen support in v1 could limit real-world use for larger initiatives — accepted tradeoff, architecture is designed not to preclude the extension later.

### Next decision point

Once v1 has run on at least one real project, revisit: whether the 2-3 directions target needs to flex, whether a paid 21st.dev tier is warranted, and how the success bar should evolve for v2.
