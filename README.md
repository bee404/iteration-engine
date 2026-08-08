# Iteration Engine

Iteration Engine is a product exploration focused on helping designers turn visual feedback into clearer, actionable iteration directions while preserving human judgment.

## Repository purpose

This repository is the source of truth for Iteration Engine's product definition and implementation. It began as a neutral workspace for reconciling two discovery tracks: the work developed inside Obvious and the supporting discovery developed outside it. That reconciliation is now recorded in the decision log, blueprint, and release plan.

## Current operating model

Obvious is the conductor for planning and building the first release, but the shipped product is a standalone application. Product decisions belong in this repository, not only in an external tool or conversation.

The operating sequence is:

1. Keep the agreed product decisions in `docs/decisions.md`.
2. Keep the resulting product shape in `docs/blueprint.md`.
3. Keep release boundaries and validation in `docs/release-plan.md`.
4. Update those documents when product decisions change, then align implementation with them.
5. Use `docs/discovery-diff.md` and the two discovery records as supporting context, not as a substitute for the current blueprint.

## Status

Discovery reconciliation was agreed on 2026-08-05. The current V1 blueprint, decisions, and release plan are approved and are the source of truth. The Next.js application scaffold is in progress; real provider integrations and end-to-end validation remain ahead.

## Repository map

- `docs/existing-obvious-discovery.md`: Obvious's current product understanding and source references
- `docs/external-discovery.md`: relevant discovery developed outside Obvious
- `docs/discovery-diff.md`: structured comparison of the two discovery tracks
- `docs/decisions.md`: decisions, rationale, owners, and unresolved questions
- `docs/blueprint.md`: agreed product blueprint after reconciliation
- `docs/release-plan.md`: release definition derived from the approved blueprint
- `app/`: Next.js application routes and UI implementation
- `lib/fixtures/`: real, previously-captured critique/directions/code-gen output replayed in demo mode
- `public/`: static assets for the application

## Demo mode (offline front-end QA)

Set `DEMO_MODE=true` to walk the entire flow — upload -> critique -> directions -> code streaming into the bottom sheet — on **real, previously-captured** data with zero external API calls and zero Turso writes. It's implemented as fixture-backed implementations of the existing `LLMProvider` / `CodeGenProvider` interfaces, selected ahead of every other provider by the same factories the live path uses (`lib/providers/**/index.ts`), so flipping the flag off restores normal live behavior with no fixture code on that path.

- Captured examples live in `lib/fixtures/` (`examples.ts` is the registry; `data/` holds verbatim captured code). Add a new example by appending a `DemoFixture` — no provider or format changes needed.
- Pin which example to replay with `DEMO_FIXTURE=<id>` (defaults to the first registered fixture).
- Because inputs are replayed, any screenshot/text a reviewer enters is accepted; the fixture's real captured output is what's returned.
- All persistence routes (`POST /api/rounds`, `POST /api/projects`, `PATCH /api/rounds/[id]`) refuse writes while demo mode is on, backed by a write guard in the DB query layer.

## Source-of-truth rule

If code, a conversation, or an external tool conflicts with the repository documentation, update the repository documentation first and record the decision in `docs/decisions.md`. Keep the README status aligned with the current blueprint and release plan.

<!-- trigger: Vercel preview build for design QA, 2026-08-05T17:34:28Z -->
