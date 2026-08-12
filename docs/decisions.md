# Decision Log

## Purpose

Record consequential product decisions, their rationale, supporting evidence, owner, date, and implementation constraints.

## Status

Reconciliation decisions recorded 2026-08-05. This is the source of truth for what was decided and why; `blueprint.md` is the resulting product shape.

## Decisions

### 1. Product center of gravity: judgment-first, not code-first

**Decision:** Coquí is a critique-and-direction decision-support tool. A round produces a critique plus several rationale-backed directions; code/prototype generation is a separate, optional step (see Decision 3), not the product's primary output.

**Rationale:** The original blueprint's one-regenerated-prototype-per-round model risked producing exactly the "shallow visual variation" the external discovery warns against — a new look each round with no comparison of genuinely different decisions. The judgment-first framing keeps Bryan choosing between real alternatives before any code is spent.

**Owner:** Bryan. **Date:** 2026-08-05.

### 2. Directions per round

**Decision:** A v1 round produces 2-3 meaningfully different directions, each with a rationale and tradeoffs.

**Rationale:** Enough to compare real alternatives without overwhelming a single review session or blowing up generation cost. Bryan confirmed this as a target, not a hard cap — exact number may flex during build.

**Update (2026-08-11):** Directions generation is now live on real Claude Sonnet, no longer mock-only. Earlier in the build `ClaudeLLMProvider.generateDirections` deliberately delegated to `MockLLMProvider` while only critique was wired to Claude — a documented scope limitation. That is now resolved: `generateDirections` calls Claude Sonnet directly via a forced `submit_directions` tool call, validated onto the typed `Direction[]` shape with the same retry/typed-error handling as critique, plus a distinctness guard. The mock's three canned options shared one identical rationale and suggestedChanges body, so the three "directions" read as the same idea under different titles; the live provider produces genuinely distinct approaches. The `ANTHROPIC_API_KEY`-unset mock fallback and `DEMO_MODE`/`FixtureLLMProvider` replay are unchanged. **Owner:** Bryan (approved after demo). **Date:** 2026-08-11.

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

**Rationale:** Unvetted by either discovery track; its proposed role (a generation layer) would duplicate the already-decided Claude Sonnet + ComfyUI pipeline with no demonstrated gap it fills. Consistent with the standing rule that a tool shouldn't drive the product without a specific, unmet need. If revisited: the recorded MCP endpoint is `https://mcp.higgsfield.ai/mcp`, last known status "needs authentication" (unconfirmed) — do not assume it is already authenticated.

**Owner:** Bryan. **Date:** 2026-08-05.

### 7. V1 success criteria

**Decision:** V1 is successful when its output is coherent: respectful of the inputs Bryan gave it (reference, feedback, stated design goal), synthesizes that feedback into an established direction, and produces a visual output Bryan can review as a clear `Source` / `Iteration` comparison against the round's direct source. This is a per-round quality bar, not a multi-project longitudinal metric. Refinement of the tool continues iteratively past this bar.

**Rationale (Bryan, verbatim intent):** "Success for our V1 is going to be output that is coherent, so output that was respectful of the things I gave it. The established direction synthesized feedback and was able to create that visual output in a way that I could have sort of a before and after. From there, we can continue to critique and refine the iteration engine." This supersedes the earlier proposed criterion (2-real-projects / signal-vs-preference accuracy), which was too longitudinal for a v1 bar.

**Owner:** Bryan. **Date:** 2026-08-05.

### 8. Product renamed to Coquí

**Decision:** The product is renamed from **Iteration Engine** to **Coquí**. Always written with the accent ("Coquí"). The former name is fully retired from product-facing surfaces. Repository/infrastructure identifiers (GitHub repo slug `iteration-engine`, `package.json` name) are not part of this decision and remain unrenamed for now — a separate follow-up if pursued.

**Rationale:** The coquí is a Puerto Rican tree frog known for a loud, repeating two-note call. The product is itself a repeated call-and-response loop — feedback in, iteration out, loop again — which the name captures better than "Iteration Engine" did. See `docs/design-system.md` for the full naming rationale and the header sound behavior recorded in Decision 15.

**Owner:** Bryan. **Date:** 2026-08-11.

### 9. Visual design system: Figma "Coquí Visual Explore" adopted, replacing the prior press-proof direction

**Decision:** The current, authoritative visual direction is the Figma file `qzgdMASkzEkxZpRL3918QD` ("Coquí Visual Explore") — a single gold accent, Owners Narrow display face over a Figtree body, and an atmospheric dot-grid ground. Full token spec lives in the repo-root `DESIGN.md`; narrative context and history in `docs/design-system.md`.

**Rationale:** Four prior visual passes were explored (Geist wireframe, cream/ink, "press proof," Figtree/blue "Direction 3"). The press-proof pass passed a full finish review and was not rejected on quality, but the direction moved to the current gold system instead — it is parked, not dead, and could be revived. Only two of the eventual screen set (Add image, Set the brief) are designed against the current system today.

**Owner:** Bryan. **Date:** 2026-08-11.

### 10. Comparison interaction is a binary toggle, not a scrubber or split view

**Decision:** The reference/iteration comparison control is a simple two-position toggle (`Source` / `Iteration`) rendered into one fixed, unmoving viewport box. There is no drag-to-wipe scrubber, no `Before / Split / After` segmented control, no draggable divider, no side-by-side view, and no thumbnail strip or timeline row.

**Rationale:** A drag-to-wipe scrubber was explicitly considered and removed before 2026-08-08. Perfect registration — everything a round produces renders into one identical box — is the product's actual differentiator; a scrubber or split view breaks that property by implying continuous, spatial comparison rather than a discrete toggle between two aligned layers. **This supersedes** the draft `Before / Split / After` + draggable-divider + highlight-toggle design described in the "BeforeAfter Visual Diff" feature blueprint and mirrored in `docs/knowledge-base/roadmap-and-open-work.md` prior to this decision being recorded — that draft is now historical, not the build target. `roadmap-and-open-work.md` has been updated accordingly.

**Owner:** Bryan. **Date:** pre-2026-08-08 (reaffirmed 2026-08-11).

### 11. Primary CTA renamed "Synthesize"

**Decision:** The primary commit action across a round is labeled **"Synthesize"**, replacing the earlier "Interpret feedback."

**Rationale:** Settled in the current Figma frames; carries the same commit semantics as before, just renamed.

**Owner:** Bryan. **Date:** 2026-08-11.

### 12. Lineage is append-only; no branching, forking, merging, or version-graph UI

**Decision:** History is a single ordered chain per screen, readable and permanent, never editable. A past selection cannot be changed and propagated forward — starting a different path means starting a new chain from that node, leaving the original chain intact. Looking at an unselected direction (including generating its code to inspect it) is non-destructive and commits to nothing. The product never exposes branching, forking, merging, or a version graph, even though the underlying data retains every unselected direction.

**Rationale:** Confirms and sharpens the standing "convergence over exploration" position (Decision 1): the product converges on one answer per round, and its history should read the same way. A lineage/chain browsing view for this history has not been designed yet — see `docs/knowledge-base/roadmap-and-open-work.md`.

**Owner:** Bryan. **Date:** pre-2026-08-08.

### 13. Desktop-only for now; responsive is deferred, not rejected

**Decision:** Responsive/adaptive layout work is explicitly stopped for the current build. The design targets a desktop viewport (~1241px) only.

**Rationale:** Keeps the current design push scoped to one viewport while the visual direction and remaining screens are still being defined. Known future requirement, not an accepted permanent constraint — revisit once the design is stable. Note this also leaves open how the iteration preview's hover-driven interactivity should translate to touch, whenever responsive work resumes.

**Owner:** Bryan. **Date:** 2026-08-11.

### 14. Round mutability, comparison failure, lineage comparison, and export are resolved

**Decision:** The first round infers a viewport box and shows its dimensions before synthesis. Bryan may correct that measurement before the first iteration is committed; after that, the box is locked for the chain. Later rounds inherit the prior goal, reviewer context, and constraints as editable defaults, require fresh feedback, and use the prior iteration as their reference.

Critique items are read-only evidence. A critique may be regenerated before directions are produced; after directions exist, the round is immutable and any changed feedback starts a new round. Code generation remains available for every direction and may be retried locally after failure.

The comparison always shows an iteration against its direct source in the chain; it is not an arbitrary node-to-node comparison tool. If generated code compiles but fails to mount, the `Iteration` layer shows the generated source and exact runtime error inside the same fixed viewport box, while `Source` continues to show the visual reference. The round remains usable.

`Save and export` is one committing action meaning "this code works for me." Save persists the approved round and its lineage record to Turso; export downloads the approved prototype as a source bundle. The current code implements persistence but not the download yet.

**Rationale:** These choices complete the immutable convergence model without introducing hidden edits, alternate histories, or a second comparison system. They also reconcile the product-facing commit semantics with the existing persistence implementation and the release-plan target.

**Owner:** Bryan. **Date:** 2026-08-11.

### 15. Header identity and progress behavior are resolved

**Decision:** The current header uses the Coquí wordmark and no stepper. The removed stepper stays removed; progress should be communicated by the active screen and its content rather than a persistent four-stage control. The header sound control plays and mutes the coquí call, defaults to muted, and must have explicit accessible labels for both states. It remains visually present but functionally disabled until the call audio is available.

The silhouette `coqui-mark.svg` is retained for favicon, app-icon, and other small-scale identity uses; it does not replace the wordmark in the header. Owners Narrow remains the approved display face. A licensed webfont is a delivery prerequisite, not an invitation to silently substitute a different visual direction.

**Rationale:** This follows the latest Figma frames and gives each previously ambiguous brand element one job. It also prevents agents from restoring superseded navigation or treating a missing font license as permission to redesign the typography.

**Owner:** Bryan. **Date:** 2026-08-11.

## Carried forward unchanged (not in conflict, no new decision needed)

- Input model: screenshot(s), feedback text, design tokens (W3C DTCG JSON), condensed style guide, optional flowchart screenshot — extended with "design goal" and "reviewer perspective/context" as explicit fields (external discovery, additive).
- Comparison workflow: a generated iteration is compared with its direct source inside a round; the ordered chain preserves history across rounds without arbitrary node-to-node comparison.
- Technical architecture: Next.js/Vercel Hobby, Zustand, Turso, Claude Sonnet primary / GPT-4o fallback, ComfyUI optional local service for visual pre-iteration and asset generation.
- Human control: the designer approves, judges quality, and decides what advances; AI never finalizes. Strongest point of agreement across both discovery tracks.

## Implementation guidance carried forward

- On-demand code generation is triggered by the per-direction `Generate code (optional)` action and opens that direction's generated-code preview.
- Start with the free 21st.dev tier. Revisit payment only if real usage hits its code-retrieval limit.
- V1 uses the per-round coherence bar in Decision 7. No longitudinal metric is required before real usage supplies evidence for one.
