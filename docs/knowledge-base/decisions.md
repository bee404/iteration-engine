# Decisions — What's Locked and Why

Durable, load-bearing decisions with the rationale a coding agent needs to avoid re-litigating
them. Research citations and benchmark trails are deliberately trimmed — they live in the
Obvious project's Findings Log if ever needed. Conclusions only.

The repo's own `docs/decisions.md` remains the formal decision log; this is a condensed,
agent-facing digest of the load-bearing ones.

## Generation engine: Claude Sonnet (GPT-4o fallback)

Claude Sonnet is the default for screenshot→code and for critique/directions — it wins on
visual fidelity and clean code output for UI generation, at low per-round cost (~$0.005/round
with screenshot downscaling and prompt caching). When `OPENAI_API_KEY` is configured alongside
Claude, GPT-4o is the typed fallback after Claude exhausts its own validation/error retries
(`lib/providers/llm/`, `lib/providers/codegen/`). Without that key, Claude remains unwrapped;
without an Anthropic key, local development uses the mock provider. Any single-shot generation
needs retries and validation heuristics, not blind trust in one call.

## Design-token format: W3C DTCG JSON, compressed for the LLM

Design tokens use the **W3C DTCG** JSON format (`$value`/`$type`), three-layer hierarchy
(primitive → semantic → component). For LLM prompting, compile to a compressed JSON index
(short keys, shallow nesting, semantic aliases) — structured JSON is far more token-efficient
than prose. CSS custom properties are generated for runtime use in prototypes. **Status:** the
token-index input model is decided but not yet built; today's grounding is the hardcoded Geist
spec injected by `lib/design-systems/` (see below).

## Design-system grounding: one hardcoded system (Vercel Geist) for now

Generated code is grounded in the Vercel Geist design system, enforced by both prompt rules and
deterministic post-processing (see `architecture.md`). This is a **proof-of-concept scope
decision**: it proves grounding changes output, using exactly one system. Per-exploration
selection is deferred because the active transient state carries no design-system reference field
yet. When that lands, `getActiveDesignSystem()` becomes a lookup and nothing else in the codegen
path changes.

## Generated components stay single-file, zero-import (v1, by design)

Every generated component is one self-contained file with no imports. This is a deliberate
constraint, not a limitation to work around: it keeps cost, persistence, and failure-surface
small, and it is exactly the shape the preview transpiler can mount without a bundler. The
codegen system prompt forbids external UI-library imports.

**Roadmap note (not v1):** the intended next step is pulling from a shared Storybook/repo/
design-system endpoint so iterations reflect real production components — close enough that a
stakeholder judges them as real, not a mockup. Revisit the transpiler choice when that is
scheduled.

## In-browser transpiler: Sucrase (not Babel-standalone or esbuild-wasm)

Sucrase is right-sized: the app generates one self-contained component with no imports to
resolve, so type-stripping (not full type-checking, not bundling) is all that's needed. It's the
lightest/fastest option with a working precedent for transpile → sandboxed iframe → mount with
no CDN. **Reversal condition:** if generated components ever need imports, esbuild-wasm becomes
the right call.

## Live-mount preview mounts with zero network requests

The React runtime is vendored and inlined into the preview document rather than loaded from a
CDN, so the sandboxed iframe mounts offline. Mount failures degrade to a read-only source view
with a notice — never a blank frame, never worse than text.

## DEMO_MODE exists so front-end/UX QA burns no compute

Bryan runs multiple front-end/UX quality passes without spending real API compute or hitting
live Claude. DEMO_MODE replays real captured outputs through the *same* provider interfaces
(fixture-backed implementations selected ahead of every other provider), so the whole flow feels
interactive end-to-end with zero external calls. It reuses the existing
mock-provider precedent rather than inventing new mocking machinery. Flipping it off restores
live behavior exactly.

## V0 durability: portable download, not application persistence

The canonical V0 exploration is transient browser state. Selecting a direction is not approval.
The durable output is a ZIP with runnable source and `coqui-context.json`; the screenshot is not
included by default and is not retained by the canonical workflow. Historical rounds, lineage,
and a stronger commit state are future retention features. The obsolete Turso approval
implementation has been removed rather than retained as a competing model.

## 21st.dev grounding: live per-round MCP query, never a bulk snapshot

21st.dev exposes a first-party programmatic surface (MCP server + CLI + shadcn registry), so
grounding directions in a real pattern library is viable. **Decided shape:** call the MCP live
per round under Bryan's own key, feed results transiently into that round's prompt context —
**do not** persist a local taxonomy/metadata snapshot. That retention pattern is explicitly
prohibited by 21st.dev's ToS (reusing structured metadata / training on content), even though
the MCP access itself is sanctioned. **Status:** wired. `getPatternProvider()` uses
`TwentyFirstProvider` when `TWENTYFIRST_API_KEY` is configured and the typed mock provider
otherwise.

## ComfyUI: optional local service, graceful degradation

ComfyUI is an *optional* local step for (1) visual pre-iteration on vague feedback (img2img,
denoise ~0.5, ControlNet preserves layout) and (2) prototype asset generation (txt2img, seed
consistency across screens). It runs locally (port 8188, no API cost). If unavailable, the system
falls back to the LLM-only path (clarify-in-text instead of visualize; gray placeholders instead
of generated assets). **Status:** decided integration shape; not part of the shipped core loop.

## Resolved product calls (quick reference)

- **Vague feedback** is flagged for clarification, never guessed at (`flaggedAmbiguities`).
- **Every prototype** follows an explicit human direction selection; selection is not formal approval.
- **Screenshots** downscale to ~1024px width before the LLM to cut image tokens.
- **Flowcharts** are just image inputs to the vision model — no structured format.
- **Multi-screen** generation is sequential with shared design context (up to ~10 screens).
- **Prototype preview** is an in-app sandboxed iframe; selected prototypes download with their full exploration context.
- **API keys** are Vercel server-only env vars; never reach the client.
- **Screenshot autocrop (future refinement):** if real-project validation shows that natural
  screenshot dimensions are insufficient, capture content *width* only (height stays fluid) for
  the codegen viewport target and attach a confidence flag.
