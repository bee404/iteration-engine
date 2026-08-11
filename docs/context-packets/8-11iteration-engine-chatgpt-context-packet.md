# Iteration Engine: ChatGPT, Codex, and Co-work Context Packet

**Prepared:** 2026-08-11  
**Purpose:** Provide the context developed in ChatGPT, Codex, and related co-work surfaces for comparison with the separate Obvious context packet.  
**Status:** Context and reconciliation input. This packet is not a replacement for the public repository's current source-of-truth documents.

## How to read this packet

This packet separates claims by provenance:

- **ChatGPT thread:** decisions, framing, and operating instructions developed in this conversation.
- **Codex repository review:** observations verified against `bee404/iteration-engine` on GitHub.
- **Codex/Cowork workflow readout:** a later workflow specification and Google Stitch prompt recorded in Codex memory from August 8.
- **Recovered Claude Code context:** the closest confirmed prior discussion about the inspiration library and Higgsfield.
- **Needs reconciliation:** a conflict, stale statement, or item that should be checked against the Obvious packet and current code.

The repository remains the authoritative implementation surface. At the last review, its knowledge base defined precedence as:

1. Code on `main`.
2. `docs/decisions.md`, `docs/blueprint.md`, and `docs/release-plan.md`.
3. `docs/knowledge-base/` as an agent-facing synthesis.

## 1. Product thesis

Iteration Engine is a personal design-iteration tool that compresses the loop between visual critique, direction-setting, exploration, and review.

The central point of view is judgment-first:

- AI helps make feedback and alternatives clearer.
- The designer remains responsible for taste, selection, quality judgment, and what advances.
- The system should produce genuinely different design decisions, not shallow visual variation.
- Code generation is an on-demand fidelity step, not a mandatory pipeline stage.
- The product should help a designer converge on a useful answer rather than create an endless branching gallery of alternatives.

The intended first user is Bryan, working on his own design projects. The shipped app is standalone. Obvious is the planning/build conductor, not a runtime dependency.

## 2. Initial ChatGPT discovery framing

The original working concept was a workflow in which a user provides:

1. A design screenshot or other visual source.
2. A design goal.
3. Raw feedback.
4. Optional role or perspective, such as designer, PM, engineer, executive, or customer.

The expected outputs were:

1. A short critique of the current design.
2. Three possible iteration directions.
3. Rationale for each direction.
4. Tradeoffs.
5. Suggested UI changes.
6. A prompt or instruction set for the next visual iteration.
7. A before/after comparison structure.

The product should not present AI as the final decision-maker. Its value is faster thinking, clearer comparison, and preserved designer judgment.

## 3. Discovery-first operating model established in ChatGPT

The first instruction to Obvious was deliberately changed from an implementation brief to a reconciliation packet. The reason was that some discovery had already happened inside Obvious and some had happened outside it. A new brief could accidentally overwrite or silently merge the two.

The agreed sequence was:

1. Recover Obvious's existing understanding of the product.
2. Add the external discovery as new evidence, not as an approved specification.
3. Classify agreements, additions, conflicts, unsupported assumptions, and premature implementation suggestions.
4. Ask Bryan only the consequential questions that materially change the product.
5. Record decisions.
6. Create an agreed blueprint.
7. Derive a release plan from the blueprint.
8. Implement only after the product definition is coherent.

This distinction is important: Obvious was asked to act as conductor for the first release, but the repository was intended to become the durable source of truth.

## 4. Repository created and published from ChatGPT

ChatGPT created the initial neutral repository with this structure:

```text
README.md
docs/
  external-discovery.md
  existing-obvious-discovery.md
  discovery-diff.md
  blueprint.md
  decisions.md
  release-plan.md
app/
public/
```

The initial repository was committed, then published publicly as:

<https://github.com/bee404/iteration-engine>

The initial operating model in `README.md` stated that Obvious should recover its existing thinking, compare the two discovery tracks, resolve decisions, then produce the blueprint and release plan.

Later, when Obvious had updated the decision documents and implementation, ChatGPT corrected the README so it stated that:

- The repository is the source of truth for product definition and implementation.
- Obvious is the conductor for planning and building, not the source of truth outside the repository.
- Product decisions belong in the repository.
- Documentation must be updated when decisions change.

The correction was committed as `9434975`.

## 5. Repository state observed by Codex

At the August 10, 2026 review, `origin/main` had advanced beyond the last local checkout. The recent main-branch history was:

| Commit | Change |
|---|---|
| `0e5914d` | Add Vercel Web Analytics |
| `4cb3dde` | Add custom app favicon |
| `6e2fae8` | Wire real Claude Sonnet critique/codegen, live-mount preview, DEMO_MODE, and Turso round persistence |
| `8318f39` | Add shared knowledge-base hub for AI coding agents |

The local checkout at that review was clean but three commits behind `origin/main`. No local work was merged or discarded during the read-only review.

The repository's current implementation direction includes:

- Next.js 16, React 19, and Zustand 5.
- Claude Sonnet behind typed provider interfaces.
- Mock and fixture providers for local and offline work.
- Turso/libSQL persistence and round history.
- SSE code streaming for on-demand code generation.
- Sucrase-based in-browser TSX transpilation.
- A sandboxed live preview iframe with vendored React runtime and source-view fallbacks.
- Vercel Geist design-system grounding and deterministic code post-processing.
- Vercel Web Analytics.
- `DEMO_MODE=true` for fixture-backed, zero-cost, zero-write front-end QA.

## 6. Current product workflow represented in the repository

The repository knowledge base describes this flow:

1. Upload a screenshot and capture its natural pixel dimensions.
2. Enter a design goal and raw feedback, with optional reviewer context and constraints.
3. Generate a critique that separates signal from preference and flags vague feedback.
4. Generate 2–3 meaningfully different directions with rationale, tradeoffs, suggested changes, and optional pattern references.
5. Request code generation for any direction, whether or not it has been selected.
6. Stream generated TSX into a bottom sheet.
7. Transpile and mount the code as an interactive component in a sandboxed iframe.
8. Approve and persist the round to Turso, chaining it to the prior round.
9. Review round history.

The implementation intentionally keeps provider selection behind interfaces. Demo mode wins over all other provider selectors, and live providers are used only when the relevant environment variables are configured.

## 7. Durable product decisions captured in the repository

The primary repository decision log records these decisions:

### Judgment-first center of gravity

The core product output is critique plus several rationale-backed directions. Code is optional and follows judgment rather than replacing it.

### Two to three directions per round

The target is 2–3 genuinely different directions. This is a flexible target, not an inflexible hard cap.

### Code generation is optional and independent

Bryan can request full code for zero, one, or several directions at any point. It does not require formally selecting a direction first.

### Standalone product

Obvious is not a runtime dependency of the shipped app.

### 21st.dev shape

The decided shape is live, per-round pattern grounding through 21st.dev rather than a bulk local mirror. The current repository still uses a mock pattern provider; live MCP integration is not wired.

### Higgsfield excluded from V1

Higgsfield was dropped from V1 because its proposed role was not supported by a demonstrated unmet need.

### V1 success criterion

V1 succeeds when a round is coherent, respectful of the inputs, synthesizes the feedback into an established direction, and produces a visual result Bryan can review as a useful before/after against the original.

## 8. Codex/Cowork workflow readout from August 8

Codex memory records a separate workflow readout and Google Stitch prompt created in a project workspace. The final readout was verified byte-for-byte against a downloaded source using `cmp -s`.

The readout describes atomic workflow units U01–U29 and adds several interaction decisions that are not fully represented in the repository's primary docs.

### Canonical convergence model

- Iteration Engine is for converging on one answer.
- Keep one canonical immutable chain.
- Do not make branching, alternate-history management, editable history, or version graphs the core workflow.

### Round lineage

- The first round starts with an uploaded screenshot.
- Later rounds reference the prior coded iteration and do not require another upload.
- The workflow retains lineage, but lineage should not become a project-management interface.

### Fixed viewport comparison

- Infer the UI viewport once from content inside the screenshot.
- Exclude browser or device chrome.
- Retain one fixed box with fixed dimensions, scale, and x/y coordinates.
- Comparison changes visibility or stacking, not geometry.

### Direction records and code

- Keep three direction records as lightweight text, rationale, tradeoffs, and grounding data.
- Generate code only on demand, including for unselected directions.
- A selected direction guarantees generation or reuse, then compilation and mounting.
- A mount failure stays local to that direction. The source, generated code, and runtime error remain visible, and the round does not fail globally.

### Four-screen Google Stitch prompt

The four selected screens were:

1. Reference and iteration brief.
2. Interpreted critique.
3. Direction decision.
4. Live comparison and commit.

The direction-decision screen contains the only required human choice per round. The prompt also required a connected, playable prototype where practical and a mount-failure study as a state, not a fifth full screen.

### Comparison interaction constraint

The user explicitly removed a scrubber in favor of a simple binary toggle:

- `Source`
- `Iteration`

The readout explicitly prohibits drag-to-wipe, partial reveal, side-by-side comparison, thumbnail strips, and changelog rows. Save & Export is framed as one product-facing commit action meaning “this code works for me,” not as developer-facing persistence language.

### Exact failure state specified by the readout

```text
This component compiled but failed to mount — showing the source instead. Uncaught TypeError: Cannot read properties of undefined (reading 'Component')
```

## 9. Recovered Claude Code and co-work context

Codex previously searched across Codex, ChatGPT, browser history, and Claude Code when trying to locate an earlier inspiration/design-iteration discussion. The closest confirmed match was a Claude Code session in the Inspo Library project:

```text
Session: 29958c73-5dc6-4a06-bccd-4fd18bc5ea44
Project: /Users/beehm/Dropbox/o53/AI resources/o53Agent/Inspo aggregator
```

That session covered:

- The local inspiration library.
- Image taxonomy and filtering.
- `PRODUCT.md`.
- `DESIGN.md`.
- Higgsfield MCP setup.

The recovered transcript did not contain a direct 21st.dev mention. It should therefore be treated as the closest confirmed related conversation, not proof that it contains the entire combined Iteration Engine discussion.

Higgsfield was recorded at:

```text
https://mcp.higgsfield.ai/mcp
```

The recorded status was `Needs authentication`. Do not treat earlier claims of full authentication as confirmed.

## 10. Material conflicts to reconcile against the Obvious packet

These are the highest-value comparison points.

### Comparison UI conflict

The Codex/Cowork workflow readout says the comparison should be a simple binary `Source / Iteration` toggle in one fixed box, with no scrubber and no side-by-side view.

The repository knowledge-base roadmap currently describes a future comparison view with:

- `Before / Split / After` segmented control.
- A draggable divider.
- A highlight toggle.
- Pixel-diff region highlighting.

This is a real product decision conflict, not merely a wording difference. Resolve it before implementing the visual diff. The user preference in the workflow readout favors the binary toggle.

### Status language conflict

The README still says the Next.js application scaffold is in progress and real provider integrations remain ahead. The knowledge base and code indicate that the core loop, real Claude path, live preview, demo mode, and Turso persistence are already on `main`.

### Release-plan sequencing drift

The release plan still sequences Turso persistence before the before/after comparison as if persistence were future work. Persistence is now shipped. The plan should distinguish:

- shipped core loop,
- remaining V1 visual-diff work,
- later integrations such as 21st.dev and GPT fallback.

### Blueprint versus implementation

The blueprint describes intended V1 outputs including before/after comparison and export. The knowledge base says those pieces are not all built. Keep the blueprint as the target product definition, but maintain an explicit implementation-status section so target behavior is not mistaken for shipped behavior.

### Source of truth and knowledge-base role

The knowledge base correctly says it is a synthesis layer. It should remain concise and agent-facing, while the primary decision log, blueprint, release plan, and code carry the durable product and implementation truth.

## 11. Current open work

According to the repository knowledge base, these items remain designed or planned rather than complete:

- Before/after visual diff.
- Screenshot content-width autocrop and confidence flag.
- A unified comparison frame and its final interaction model.
- GPT-4o fallback on Claude validation failure.
- Live 21st.dev MCP grounding.
- Per-project or per-round design-system selection.
- W3C DTCG token-index input model.
- Optional ComfyUI visual pre-iteration and asset generation.
- Project management UI beyond one implicit project.

The first three items are dependent on the comparison decision above. The visual-diff work should not begin until the binary-toggle versus scrubber/split interaction is settled.

## 12. Suggested reconciliation questions for the separate Obvious packet

1. Which document is the current product target: the repository blueprint, the U01–U29 workflow readout, or a reconciled combination?
2. Is the comparison interaction definitively binary `Source / Iteration`, or is the roadmap's `Before / Split / After` and draggable divider still intended?
3. Is the product converging on one canonical chain, or should users manage branches and alternate histories?
4. What exactly does Save & Export commit from the user's point of view?
5. Which parts of the current app have been exercised with real Claude, real Turso, and DEMO_MODE?
6. What remains before the V1 success criterion has been demonstrated on a real Obsidian53 screen?
7. Which documentation should be updated first to remove the README and release-plan status drift?
8. Should this context packet remain outside the public repository because it contains cross-agent provenance and local paths, or should a sanitized version be committed under `docs/`?

## 13. Recommended next state

After comparing this packet with Obvious's packet:

1. Resolve the comparison interaction conflict.
2. Update `docs/decisions.md` with that decision and its rationale.
3. Update `docs/blueprint.md` and `docs/release-plan.md` to match.
4. Update the README status to distinguish shipped core-loop behavior from remaining V1 work.
5. Keep this packet as an external reconciliation artifact, or commit a sanitized version only after removing local paths, session identifiers, and private provenance that does not belong in a public repository.

## 14. Source references

### Public repository

- <https://github.com/bee404/iteration-engine>
- `README.md`
- `docs/blueprint.md`
- `docs/decisions.md`
- `docs/release-plan.md`
- `docs/knowledge-base/README.md`
- `docs/knowledge-base/architecture.md`
- `docs/knowledge-base/decisions.md`
- `docs/knowledge-base/qa-conventions.md`
- `docs/knowledge-base/roadmap-and-open-work.md`

### ChatGPT and Codex artifacts

- Initial repository and reconciliation work in this ChatGPT thread.
- Codex workflow readout recorded August 8, 2026.
- Google Stitch four-screen prompt recorded August 8, 2026.
- Codex memory entry for the closest recovered Claude Code/Inspo Library discussion recorded August 3, 2026.

## 15. Confidence and handling notes

- Repository implementation claims were read from `origin/main` during the August 10 scan.
- Workflow readout claims came from a Codex memory summary and should be compared with the source artifact if available.
- Claude Code history claims are explicitly limited to the closest confirmed related session.
- No claim is made here that this packet contains every message from every agent surface. It is a consolidated, provenance-labeled handoff designed to make gaps and conflicts visible for reconciliation.

