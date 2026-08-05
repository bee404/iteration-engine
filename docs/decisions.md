# Decision Log

## Purpose

Record consequential product decisions, their rationale, supporting evidence, owner, date, and any questions that remain open.

## Status

Reconciliation decisions recorded 2026-08-05. This is the source of truth for what was decided and why; `blueprint.md` is the resulting product shape.

## Decisions

### 1. Product center of gravity: judgment-first, not code-first

**Decision:** Iteration Engine is a critique-and-direction decision-support tool. A round produces a critique plus several rationale-backed directions; code/prototype generation is a separate, optional step (see Decision 3), not the product's primary output.

**Rationale:** The original blueprint's one-regenerated-prototype-per-round model risked producing exactly the "shallow visual variation" the external discovery warns against — a new look each round with no comparison of genuinely different decisions. The judgment-first framing keeps Bryan choosing between real alternatives before any code is spent.

**Owner:** Bryan. **Date:** 2026-08-05.

### 2. Directions per round

**Decision:** A v1 round produces 2-3 meaningfully different directions, each with a rationale and tradeoffs.

**Rationale:** Enough to compare real alternatives without overwhelming a single review session or blowing up generation cost. Bryan confirmed this as a target, not a hard cap — exact number may flex during build.

**Owner:** Bryan. **Date:** 2026-08-05.

### 3. Code/prototype generation is optional and on-demand, never a required pipeline stage

**Decision:** Generating full code for a direction is an action Bryan can trigger for zero, one, or several directions, at any point — independent of whether he has formally "picked" a direction yet. It is a fidelity option, not a mandatory last step of the workflow.

**Rationale (Bryan, verbatim intent):** "I don't want to commit and say it needs to be an optional step... I also don't want to commit and say they have to be coded and that's required as part of the workflow." Confirmed explicitly: code generation is never mandatory and can be requested for any direction at any time.

**Owner:** Bryan. **Date:** 2026-08-05.

### 4. Orchestration: standalone app, no runtime dependency on Obvious

**Decision:** The shipped product is a fully standalone Next.js/Vercel app. Obvious is the tool used to plan and build it, not a runtime dependency of the deployed product.

**Rationale:** Matches the already-decided "modular and agnostic" principle and keeps the product portable.

**Owner:** Bryan. **Date:** 2026-08-05.

### 5. 21st.dev adopted for v1, via live per-round MCP queries

**Decision:** Integrate 21st.dev as a grounding source for direction generation, so the tool can reference existing layout/component patterns instead of inventing novel layouts every round. Integration is via live, on-demand queries to 21st.dev's MCP server (`https://21st.dev/api/mcp`) under Bryan's own API key, at generation time — not a bulk local mirror of their taxonomy.

**Rationale:** Confirmed research (see `21st.dev Integration Research — Findings`, art_6m8KogH2): 21st.dev exposes a legitimate MCP server, an `@21st-dev/cli` npm package, and a shadcn-compatible per-component registry. Search/metadata is free and query-driven; code retrieval is capped at 2/day on the free tier, uncapped on paid plans. Their Terms of Service (last updated 2026-07-20) explicitly prohibit scraping, bulk collection, AI-model training use, and redistribution of structured metadata or media — ruling out a pre-scraped local snapshot even though live API access is sanctioned.

**Fallback:** Manual browsing of 21st.dev remains a zero-integration fallback if API costs or rate limits become an issue.

**Owner:** Bryan. **Date:** 2026-08-05.

### 6. Higgsfield dropped for v1

**Decision:** Do not evaluate or integrate Higgsfield for v1.

**Rationale:** Unvetted by either discovery track; its proposed role (a generation layer) would duplicate the already-decided Claude Sonnet + ComfyUI pipeline with no demonstrated gap it fills. Consistent with the standing rule that a tool shouldn't drive the product without a specific, unmet need.

**Owner:** Bryan. **Date:** 2026-08-05.

### 7. V1 success criteria

**Decision:** V1 is successful when its output is coherent: respectful of the inputs Bryan gave it (screenshot, feedback, stated design goal), synthesizes that feedback into an established direction, and produces a visual output Bryan can review as a clear before/after comparison against the original. This is a per-round quality bar, not a multi-project longitudinal metric. Refinement of the tool continues iteratively past this bar.

**Rationale (Bryan, verbatim intent):** "Success for our V1 is going to be output that is coherent, so output that was respectful of the things I gave it. The established direction synthesized feedback and was able to create that visual output in a way that I could have sort of a before and after. From there, we can continue to critique and refine the iteration engine." This supersedes the earlier proposed criterion (2-real-projects / signal-vs-preference accuracy), which was too longitudinal for a v1 bar.

**Owner:** Bryan. **Date:** 2026-08-05.

## Carried forward unchanged (not in conflict, no new decision needed)

- Input model: screenshot(s), feedback text, design tokens (W3C DTCG JSON), condensed style guide, optional flowchart screenshot — extended with "design goal" and "reviewer perspective/context" as explicit fields (external discovery, additive).
- Comparison workflow: both axes kept — version history across rounds over time, and comparing multiple directions within a single round.
- Technical architecture: Next.js/Vercel Hobby, Zustand, Turso, Claude Sonnet primary / GPT-4o fallback, ComfyUI optional local service for visual pre-iteration and asset generation.
- Human control: the designer approves, judges quality, and decides what advances; AI never finalizes. Strongest point of agreement across both discovery tracks.

## Open questions carried into the blueprint

- Exact UI mechanism for triggering on-demand code generation per direction — implementation detail, resolved during build.
- Whether a paid 21st.dev tier is needed once real usage patterns against the 2/day free-tier code-retrieval cap are known.
- Success criteria will evolve past the v1 bar as Bryan uses the tool on real projects; no longitudinal metric is locked in yet.
