# Architecture — The Shipped System

This describes what is **actually on `main`** as of the full-stack merge (`6e2fae8`, PRs #2–#9
all merged). Where a claim in an older research doc is now outdated by shipped code, this file
reflects the code. Paths are repo-relative.

## Stack

- **Next.js 16** (App Router) + **React 19**, deployed on **Vercel**. TypeScript throughout.
- **Zustand 5** for client round state (`store/round-store.ts`).
- **Turso / libSQL** (`@libsql/client`) for round-history persistence.
- **Sucrase** for in-browser TSX transpilation of generated components.
- **@vercel/analytics** for usage tracking.
- **Claude Sonnet** (Anthropic) for critique, directions, and code generation, behind typed
  provider interfaces with mock + fixture fallbacks.

Note: React is used two ways — the app itself (Next.js/React) and a separately vendored React
runtime inlined into the preview iframe (see Live-mount preview below). There is no separate
Vite app in this repo; the standalone Vite prototype Bryan saw earlier lived outside this
pipeline.

## Pipeline stages (upload → approved round)

1. **Upload & inputs** (`components/upload-form.tsx`) — user selects a screenshot and fills
   Design goal + Raw feedback (required), Reviewer context + Constraints (optional). The file
   is read to a `data:` URL (server-readable for the vision call). Natural pixel dimensions are
   captured at upload via `lib/image-dimensions.ts` and stored on the round
   (`screenshotDimensions`).
2. **Critique** (`POST /api/critique`) — Claude Sonnet returns a `Critique`: a summary, `signal`
   (real problems) separated from `preference` (taste), and `flaggedAmbiguities` (feedback too
   vague to act on, surfaced for clarification instead of guessed at).
3. **Directions** (`POST /api/directions`) — 2–3 genuinely different `Direction`s, each with
   `rationale`, `tradeoffs`, `suggestedChanges`, and an optional `patternReference` (21st.dev).
4. **Code generation** (`POST /api/generate`, SSE) — per-direction, on demand. Streams TSX
   token-by-token into a full-width bottom sheet (`components/code-sheet.tsx`). Grounded in the
   direction + design goal + screenshot + the active design system.
5. **Live-mount preview** (`components/preview-frame.tsx`) — on completion, the TSX is
   transpiled with Sucrase and mounted as an interactive component in a sandboxed iframe.
6. **Approve & persist** — approving a round writes it to Turso (`lib/persist-round.ts` →
   `POST /api/rounds`), chained to the prior round via `previousRoundId`. A History section
   (`components/round-history.tsx`) reads back recent rounds.

The orchestration lives in `components/round-workspace.tsx` over the Zustand store; API routes
are in `app/api/*/route.ts`.

## Provider interfaces

Three provider families, each a typed interface selected by a factory. Callers never branch on
which implementation runs — that is the whole point of the shape.

### LLM (critique + directions) — `lib/providers/llm/`
`getLLMProvider()` selection order (`index.ts`):
1. `DEMO_MODE=true` → `FixtureLLMProvider` (replays captured output).
2. `LLM_PROVIDER=mock` → `MockLLMProvider`.
3. `ANTHROPIC_API_KEY` set → `ClaudeLLMProvider` (real Sonnet, typed error codes).
4. else → `MockLLMProvider` (local dev without a key still works).
5. `LLM_PROVIDER=claude` with no key → throws loudly (misconfiguration, never a silent fallback).

### Codegen — `lib/providers/codegen/`
`getCodeGenProvider()` mirrors the LLM factory exactly (`FixtureCodeGenProvider` → mock →
`ClaudeCodeGenProvider` → mock; `CODEGEN_PROVIDER=claude` with no key throws). The Claude
codegen provider appends a condensed design-system spec to every prompt (see below).

### Patterns (21st.dev grounding) — `lib/providers/patterns/`
`getPatternProvider()` **always returns `MockPatternProvider` today.** The live 21st.dev MCP
integration is a decided shape (live per-round query, no bulk snapshot — see `decisions.md`) but
is **not yet wired**: the factory has a comment marking where a `TwentyFirstProvider` branches
in once `TWENTYFIRST_API_KEY` is configured. Do not assume live pattern lookups happen.

## Data model — `lib/types.ts`

The core shapes (also the Turso persisted shapes, `lib/db/schema.sql`):

- **`Round`** — inputs (`screenshotRef`, `screenshotDimensions`, `designGoal`, `feedbackText`,
  `reviewerContext`, `constraints`), outputs (`critique`, `directions`, `selectedDirectionId`,
  `generatedCode`), `approvalStatus`, and `previousRoundId` (the round-to-round chain).
- **`Critique`** — `{ summary, signal[], preference[], flaggedAmbiguities[], model }`. `signal`
  and `preference` are `SignalPreferenceItem[]`.
- **`Direction`** — `{ id, title, rationale, tradeoffs, suggestedChanges[], patternReference }`.
- **`GeneratedCode`** — `{ id, directionId, language, code, status, createdAt }` where status is
  `streaming | complete | error`.
- **`ImageDimensions`** — `{ width, height }`, nullable on a round for legacy rounds captured
  before dimension capture existed. Load-bearing for the future visual diff.

Note there is **no region/selector/bounding-box** concept anywhere — feedback and directions do
not know *which part of the screen* they target. That gap matters for the visual-diff feature
(see `roadmap-and-open-work.md`).

## Turso persistence

- SQLite-at-the-edge via `@libsql/client` (`lib/db/client.ts`, `queries.ts`, `migrate.ts`).
- Structured fields (signal/preference, directions, suggested changes, pattern references) are
  stored as JSON `TEXT` columns and parsed at the query layer — SQLite has no array/object type
  and these are always read whole.
- Tables: `projects`, `rounds`, `critiques`, `directions`, `generated_code`, with indexes on the
  foreign keys. `rounds.previous_round_id` self-references for version history.
- Single-workspace V1: every round belongs to one implicit project, created lazily on first
  approval (`lib/persist-round.ts`). No project-switcher UI yet.

## DEMO_MODE fixture replay — `lib/demo-mode.ts`, `lib/fixtures/`

`DEMO_MODE=true` walks the entire flow on **real, previously-captured** data with zero external
API calls and zero Turso writes:

- `isDemoMode()` is checked **first** in every provider factory, ahead of every other selector,
  so the live path is fully bypassed regardless of `ANTHROPIC_API_KEY` / `LLM_PROVIDER` /
  `CODEGEN_PROVIDER`. Flipping it off restores live behavior exactly — no fixture code sits on
  the live path.
- Fixtures are registered in `lib/fixtures/examples.ts`; verbatim captured code lives in
  `lib/fixtures/data/`. `DEMO_FIXTURE=<id>` pins which example replays (defaults to first).
- **Writes are refused** while demo mode is on: `assertWritesAllowed()` is a defense-in-depth
  backstop in the DB layer, and the persistence routes (`POST /api/rounds`, `POST /api/projects`,
  `PATCH /api/rounds/[id]`) short-circuit with a typed `demo_mode` error before reaching it.
  Reads are not blocked.

## Live-mount preview via Sucrase — `lib/preview/`, `components/preview-frame.tsx`

- While streaming (or after a codegen error), `PreviewFrame` shows accumulated source as
  read-only text in a script-less iframe.
- On `complete`, `transpilePreviewComponent()` (`lib/preview/build-preview-document.ts`)
  strips any stray markdown fence, transpiles the TSX with Sucrase (`typescript, jsx, imports`
  transforms), and `buildPreviewDocument()` assembles an HTML doc that mounts the component in a
  `sandbox="allow-scripts"` iframe.
- The React runtime is **vendored and inlined** (`lib/preview/react-runtime.generated.ts`, built
  by `scripts/build-preview-runtime.mjs` at prebuild) so the iframe mounts with **zero network
  requests** — no CDN.
- Robust fallbacks: if transpile fails, or if the component compiles but throws at mount (the
  iframe reports mount errors back over `postMessage` across its opaque origin), it falls back to
  the read-only source view with a notice — **never a blank frame**. The specified notice copy is
  "This component compiled but failed to mount — showing the source instead," followed by the raw
  runtime error (e.g. `Uncaught TypeError: Cannot read properties of undefined (reading
  'Component')`) — see `docs/design-system.md` for the full copy table.
- This is why generated components are constrained to a single self-contained file with no
  imports (see `decisions.md`): it is exactly the shape Sucrase can transpile without a bundler.

## Design-system enforcement pipeline — `lib/design-systems/`, `lib/providers/codegen/postprocess.ts`

> Not to be confused with Coquí's own application UI (the upload screen, brief panel, header,
> etc.), which follows a *different* design system — the gold-accent Figma direction documented
> in `docs/design-system.md` and the repo-root `DESIGN.md`. What follows here grounds only the
> code this tool *generates* as a direction's prototype.

Generated code is grounded in one hardcoded design system (**Vercel Geist**,
`lib/design-systems/vercel-geist.ts`) via two cooperating layers:

1. **Prompt grounding** — `formatDesignSystemForPrompt()` appends a condensed Geist spec
   (palette, type, radii, component rules, a **closed color allowlist**) to every codegen
   request. `getActiveDesignSystem()` returns the one system today; it becomes a per-project
   lookup when the data model carries a design-system reference (future scope).
2. **Deterministic post-processing** (`postProcessGeneratedCode`) — never depends on the model:
   - `stripCodeFences` — removes stray markdown fences.
   - `enforceColorAllowlist` — rewrites any off-palette hex to the nearest allowed token and
     surfaces a warning (`getColorAllowlist()` is derived from the active system so it can't
     drift from the prompt).
   - `ensureFontFace` — injects a self-hosted `@font-face` (base64 Geist woff2) so text renders
     in Geist, not an Arial fallback.
   - `detectEmojiIcons` — warns when emoji/glyph icons appear (line SVGs are required).

The combined behavior is regression-tested by `npm run verify:codegen`
(`scripts/verify-codegen-postprocess.ts`) against the real Test-1 capture fixture; it asserts
12/12 checks (one sanity + the nine codified fix-ups, two of which are checked on both the
deterministic and prompt sides). See `qa-conventions.md`.

## Key commands

- `npm run dev` — local dev server.
- `npm run lint` — ESLint (run before every commit; do not run `tsc` in-sandbox).
- `npm test` — node test runner over `lib/**/*.test.ts`.
- `npm run verify:codegen` — codegen post-processing regression (must report 12/12).
- `npm run db:migrate` — apply the Turso schema.
- `DEMO_MODE=true npm run dev` — offline front-end QA on captured fixtures.

