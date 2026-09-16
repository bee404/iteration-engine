![Coquí wordmark over a dark topographic field](public/brand/upload-hero.png)

# Coquí

Coquí is a designer-controlled exploration tool that turns a screenshot and raw feedback into a structured critique, a few rationale-backed directions, and a portable coded prototype.

Instead of jumping straight from a prompt to one opaque answer, Coquí makes the reasoning visible. It separates real problems from taste, flags ambiguity, lets the designer choose which direction is worth prototyping, and keeps the source and generated iteration available for direct comparison.

> **Current status:** Closed-alpha V0. The single-screen workflow is implemented on `main`, but the complete loop still needs broader real-project validation. This repository is public for review; it is not yet a generally available or licensed open-source release.

## The workflow

`Screenshot + brief → critique → 2–3 directions → selected prototype → Source / Iteration review → context-rich ZIP`

1. **Bring the evidence.** Upload a screenshot, state the design goal, and add raw feedback, reviewer context, and constraints.
2. **Separate signal from preference.** Claude returns a structured critique with real problems, taste-based feedback, and ambiguities that need clarification.
3. **Compare bounded directions.** Coquí generates 2–3 meaningfully different approaches with rationale, tradeoffs, suggested changes, and optional 21st.dev pattern grounding.
4. **Choose what is worth making.** The designer selects one direction for streamed code generation. Selection expresses an intent to explore, not automatic approval.
5. **Review like for like.** The source and generated iteration share one fixed viewport with a binary `Source` / `Iteration` control.
6. **Take the work with you.** The browser downloads a runnable Vite/React prototype and `coqui-context.json`, which carries the inputs, critique, selected direction, viewport, generation notes, and provider/model provenance.

The screenshot and exploration remain in browser-session state. V0 does not retain screenshots, approvals, or history.

## What is implemented on `main`

- Screenshot upload/paste, image preprocessing, natural-dimension capture, and editable viewport correction.
- Real Claude critique and direction generation behind typed provider interfaces.
- Selected-direction code generation streamed over SSE into an interactive, sandboxed preview.
- Source-view and runtime-error fallbacks so failed generated code never becomes a blank frame.
- A fixed-box `Source` / `Iteration` comparison with a locked exploration viewport.
- A client-generated ZIP containing runnable source and the context behind the prototype.
- Conditional GPT-4o fallback and live 21st.dev grounding when their server-side keys are configured.
- Fixture-backed `DEMO_MODE` for deterministic, zero-model-call walkthroughs.
- Access control, screenshot validation, burst limiting, iframe isolation, redacted security events, Dependabot, and dependency-audit automation.

See [the shipped-system architecture](docs/knowledge-base/architecture.md) and [roadmap and open work](docs/knowledge-base/roadmap-and-open-work.md) for the implementation boundary.

## Verification snapshot

Checked against `main` on 2026-09-16:

- `npm test`: 116 of 116 automated tests passed.
- `npm run verify:codegen`: 12 of 12 deterministic checks passed.
- `npm run build`: production build passed.
- `npm run lint`: 0 errors and 11 warnings from the known font-loading rule and standalone design-prototype image elements.
- `npm run context:check`: the shared agent-context contract passed.
- Manual Step 5 design QA passed at 1687 × 1130 and 1241 × 800, including viewport containment, Source / Iteration switching, iframe interaction, and access to final actions. See [the recorded QA evidence](design-qa.md).

These checks verify the implementation and review surfaces. They do not substitute for broader closed-alpha use on real design work, which remains the current release gate.

## Active work, not on `main`

[Draft PR #55](https://github.com/bee404/iteration-engine/pull/55) changes code generation to preserve the source screen's visual system by default. It passes the full round context and locked viewport into generation, and makes design-system restyling or broader redesign explicit modes instead of global behavior.

That work was prompted by a real-project run in which the prior pipeline replaced the source application's visual system with a generic template. It is public and reviewable, but it should not be described as shipped until the PR is approved and merged.

## How this repository uses AI

Coquí is also a working record of an AI-assisted product-development practice:

- **Repository-first context.** Product decisions, release boundaries, design rules, and public claims live in versioned source files rather than disappearing into tool-specific conversations.
- **Evidence before claims.** Implemented, validated, planned, and exploratory work are kept separate. Public messaging narrows claims when the product evidence does not support them yet.
- **Typed model boundaries.** Critique, directions, pattern grounding, and code generation sit behind provider interfaces with explicit mock, fixture, primary, and fallback behavior.
- **Deterministic review.** `DEMO_MODE` replays captured real output through the same interfaces as the live path, making full-flow UX and regression checks repeatable without model cost.
- **Human judgment gates.** AI structures critique and produces options; the designer decides what advances. Green CI does not replace hands-on design QA.
- **Cross-tool context without a shared black box.** `AGENTS.md` routes every coding agent to the same source of truth, while ContextBridge transports compact, source-backed changes without replacing GitHub as the durable record.
- **Visible QA.** Design changes include the states to inspect, known gaps, and visual evidence. The [Step 5 comparison QA](design-qa.md) is one concrete example.

## Architecture

| Layer | Current implementation |
| --- | --- |
| Application | Next.js 16, React 19, TypeScript |
| Client state | Zustand, transient per-exploration state |
| Primary models | Claude Sonnet for critique, directions, and code generation |
| Optional fallback | GPT-4o after typed Claude failures |
| Pattern grounding | Live 21st.dev MCP query when configured |
| Generated preview | Sucrase transpilation and a zero-network sandboxed iframe |
| Export | Client-generated Vite/React ZIP plus `coqui-context.json` |
| Hosting | Vercel, with credential-gated live production and open fixture previews |

The generated preview uses a vendored React runtime and a Content Security Policy that blocks network requests, remote assets, forms, plugins, media, and base-URL changes. The architecture document covers the provider selection order, active data model, fallback behavior, and security boundary in detail.

## Run it locally

### Requirements

- Node.js 22
- npm

### Offline demo

The fastest way to review the complete interface uses captured real output and makes no external model calls:

```bash
git clone https://github.com/bee404/iteration-engine.git
cd iteration-engine
npm ci
cp .env.local.example .env.local
DEMO_MODE=true npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The root route redirects to the upload step.

The current Hightouch fixture intentionally reuses one captured component across all three direction selections so every demo path reaches comparison and export. Direction metadata remains distinct in the download payload; the code capture is shared for deterministic QA.

### Live providers

Copy `.env.local.example` to `.env.local` and add only the services you want to exercise:

- `ANTHROPIC_API_KEY` enables Claude critique, directions, and code generation.
- `OPENAI_API_KEY` enables the GPT-4o fallback when Claude returns a typed validation failure.
- `TWENTYFIRST_API_KEY` enables live 21st.dev pattern grounding.
- `COQUI_ACCESS_USERNAME` and `COQUI_ACCESS_PASSWORD` are both required for live production. Missing or partial production credentials fail closed.

Without live keys, the provider factories fall back to typed mock behavior. Never commit real credentials.

## Verification

```bash
npm test
npm run verify:codegen
npm run lint
npm run build
npm run context:check
```

- `npm test` covers provider fallback, input and access boundaries, preview behavior, viewport handling, comparison, export, and generation paths.
- `verify:codegen` checks the deterministic code-generation post-processing contract.
- `context:check` verifies that shared source files and platform adapters still point to the repository's canonical agent context.

`npm run verify:directions` is a separate, manual live-provider check. It requires `ANTHROPIC_API_KEY`, makes a billable Claude request, and prints the generated directions for human distinctness review.

Manual design QA remains required for user-visible changes. Pull requests should include a preview link, exact states to inspect, and known gaps.

## Known limits

- Single-screen, desktop-first explorations only.
- No historical rounds, approval state, screenshot hosting, lineage, or retention model in V0.
- No responsive or touch workflow yet.
- No project switcher or per-exploration design-system selector.
- No general claim of production-ready, pixel-perfect, or design-system-faithful generated output.
- Content-width autocrop and confidence scoring remain possible precision improvements, contingent on real-project evidence.
- ComfyUI clarification, multi-screen workflows, and richer history are deferred.

## Availability and license

The hosted product is a credential-gated closed alpha. Public fixture previews can remain open because they cannot call live providers.

The intended distribution model is open source, forkable, and bring-your-own-key. That release is **not available yet**: the repository currently has no license or contributor guide. Until a license is added, public visibility should not be interpreted as permission to reuse, modify, or redistribute the code.

## Repository map

- [`PRODUCT.md`](PRODUCT.md): current product purpose, users, capabilities, and constraints.
- [`DESIGN.md`](DESIGN.md): authoritative Coquí token and component specification.
- [`docs/decisions.md`](docs/decisions.md): consequential product decisions and rationale.
- [`docs/blueprint.md`](docs/blueprint.md): agreed product shape and workflow.
- [`docs/release-plan.md`](docs/release-plan.md): release boundary, validation plan, and deferred scope.
- [`docs/design-system.md`](docs/design-system.md): visual identity, brand assets, copy, and design history.
- [`docs/knowledge-base/`](docs/knowledge-base/README.md): implementation, QA, architecture, and open-work guidance.
- [`design-review/`](design-review/): design QA evidence, brand studies, and standalone continuity prototypes. These artifacts are not the production application.
- [`.agents/product-marketing.md`](.agents/product-marketing.md): audience, positioning, proof, voice, and public claims boundaries.
- [`AGENTS.md`](AGENTS.md): canonical context-routing entrypoint for coding and product agents.
- [`contextbridge/`](contextbridge/README.md): compact, evidence-backed context transport across tools.
- [`app/`](app/): Next.js routes and API implementation.
- [`components/`](components/): product interface and generated-preview surfaces.
- [`lib/`](lib/): providers, fixtures, preview runtime, export, state, and security boundaries.

## Project history and source of truth

Coquí began as a workspace for reconciling product discovery developed inside Obvious with supporting discovery developed outside it. That work was consolidated into the decision log, blueprint, release plan, design-system documentation, and agent knowledge base. Obvious remains part of the planning and build workflow, but the application is standalone and has no runtime dependency on it.

GitHub is the durable authority. When implementation, documentation, or an external conversation conflicts with an approved product decision, update the repository source of truth and record the decision before treating the new direction as current.

`AGENTS.md` is the canonical entrypoint for agents working in this repository. Claude Code and GitHub Copilot use small adapters that point back to it rather than duplicating product rules.
