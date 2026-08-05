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
- `public/`: static assets for the application

## Source-of-truth rule

If code, a conversation, or an external tool conflicts with the repository documentation, update the repository documentation first and record the decision in `docs/decisions.md`. Keep the README status aligned with the current blueprint and release plan.
