# Discovery Diff

## Purpose

Compare the existing Obvious discovery with the external discovery without silently merging them.

## Status

Complete. All consequential differences were resolved with Bryan; see `decisions.md`.

## Comparison

Classification legend: **Aligned** · **Additive** · **Conflicting** · **Existing more specific** · **External more specific** · **Unsupported assumption** · **Requires a product decision**

| Topic | Classification | Resolution |
|---|---|---|
| Product definition | Conflicting | Resolved: judgment-first (critique + directions), code deferred. See Decision 1. |
| Primary user | Aligned | Bryan, solo designer, personal/internal tool. No conflict. |
| Core job | Conflicting | Resolved alongside product definition (Decision 1). |
| Unit of work | Requires a product decision | Resolved: 2-3 directions per round with critique + rationale (Decision 2). |
| Input model | Additive | External adds "design goal" and "reviewer perspective/context" as explicit fields; carried forward alongside existing design-tokens/style-guide grounding. |
| Output model | Conflicting | Resolved alongside product definition and code-generation policy (Decisions 1 and 3). |
| Critique vs. generation | External more specific | Adopted: critique is now a first-class, designer-facing output, not just an internal gate. |
| Number and nature of directions | Requires a product decision | Resolved: 2-3 directions, rationale for all; full code generation is optional per direction (Decisions 2 and 3). |
| Comparison workflow | Aligned (mechanism differs) | Both axes kept: version history across rounds (existing) and comparing multiple directions within a round (external). |
| Human control | Aligned | Strongest point of agreement; anchors every other decision. |
| Persistence | Existing more specific | Turso carries forward unchanged; external discovery was silent here. |
| Integration strategy | Unsupported assumption (external tool candidates) | Resolved: 21st.dev adopted via live MCP queries (Decision 5); Higgsfield dropped for v1 (Decision 6). |
| Orchestration | Requires a product decision | Resolved: standalone app, no runtime dependency on Obvious (Decision 4). |
| Technical architecture | Existing more specific | Existing stack carries forward as the default (Next.js/Vercel, Zustand, Turso, Claude Sonnet + GPT-4o fallback, optional ComfyUI). |
| Release scope | Requires a product decision | Resolved in `release-plan.md`, derived from Decisions 1-7. |
| Success criteria | Unsupported assumption (both tracks) | Resolved: coherent, input-respectful output with a before/after comparison (Decision 7). |

See `docs/decisions.md` for the full rationale, owner, and date behind each resolution.
