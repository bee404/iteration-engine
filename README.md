# Coquí

Coquí is a personal design-iteration tool that turns visual feedback into a critique, a small set of rationale-backed directions, and an optional coded iteration while preserving designer judgment.

## Repository purpose

This repository is the source of truth for Coquí's product definition and implementation. It began as a neutral workspace for reconciling two discovery tracks: the work developed inside Obvious and the supporting discovery developed outside it. That reconciliation, plus the later Claude and ChatGPT context packets, is now distilled into the decision log, blueprint, release plan, design-system documentation, and agent knowledge base.

## Current operating model

Obvious is the conductor for planning and building the first release, but the shipped product is a standalone application. Product decisions belong in this repository, not only in an external tool or conversation.

The operating sequence is:

1. Keep the agreed product decisions in `docs/decisions.md`.
2. Keep the resulting product shape in `docs/blueprint.md`.
3. Keep release boundaries and validation in `docs/release-plan.md`.
4. Update those documents when product decisions change, then align implementation with them.
5. Use `docs/discovery-diff.md` and the two discovery records as supporting context, not as a substitute for the current blueprint.

## Status

Discovery reconciliation was agreed on 2026-08-05 and the cross-tool context packets were consolidated on 2026-08-11. The core round is implemented: upload and intake, real Claude critique and directions, on-demand streamed code generation, live-mount preview with source fallback, Turso persistence and history, and fixture-backed demo mode.

V1 is not complete. The remaining release work is the inferred fixed viewport box, the binary `Source` / `Iteration` comparison, downloadable source-bundle export, live 21st.dev grounding, the intended GPT-4o validation fallback, and validation against a real project. See `docs/release-plan.md` and `docs/knowledge-base/roadmap-and-open-work.md` for the current boundary.

## Repository map

- `docs/existing-obvious-discovery.md`: Obvious's current product understanding and source references
- `docs/external-discovery.md`: relevant discovery developed outside Obvious
- `docs/discovery-diff.md`: structured comparison of the two discovery tracks
- `DESIGN.md`: authoritative Coquí token and component specification
- `docs/decisions.md`: decisions, rationale, and owners
- `docs/blueprint.md`: agreed product blueprint after reconciliation
- `docs/release-plan.md`: release definition derived from the approved blueprint
- `docs/design-system.md`: visual identity, brand assets, copy, and design history
- `docs/knowledge-base/`: concise implementation, QA, and open-work guidance for coding agents
- `.agents/product-marketing.md`: launch positioning, audience, messaging, proof, and claims boundaries
- `AGENTS.md`: repository-wide context routing for coding and product agents
- `app/`: Next.js application routes and UI implementation
- `lib/fixtures/`: real, previously-captured critique/directions/code-gen output replayed in demo mode
- `public/brand/`: durable Coquí brand assets exported from the current Figma direction

## Demo mode (offline front-end QA)

Set `DEMO_MODE=true` to walk the entire flow — upload -> critique -> directions -> code streaming into the bottom sheet — on **real, previously-captured** data with zero external API calls and zero Turso writes. It's implemented as fixture-backed implementations of the existing `LLMProvider` / `CodeGenProvider` interfaces, selected ahead of every other provider by the same factories the live path uses (`lib/providers/**/index.ts`), so flipping the flag off restores normal live behavior with no fixture code on that path.

- Captured examples live in `lib/fixtures/` (`examples.ts` is the registry; `data/` holds verbatim captured code). Add a new example by appending a `DemoFixture` — no provider or format changes needed.
- Pin which example to replay with `DEMO_FIXTURE=<id>` (defaults to the first registered fixture).
- Because inputs are replayed, any screenshot/text a reviewer enters is accepted; the fixture's real captured output is what's returned.
- All persistence routes (`POST /api/rounds`, `POST /api/projects`, `PATCH /api/rounds/[id]`) refuse writes while demo mode is on, backed by a write guard in the DB query layer.

## Security baseline

- Live production requires both `COQUI_ACCESS_USERNAME` and `COQUI_ACCESS_PASSWORD`; it fails closed if either is missing. Local development and public `DEMO_MODE=true` previews remain open.
- Model endpoints have best-effort per-instance burst limits. Vercel Firewall remains the distributed traffic and DDoS layer.
- Screenshot input accepts only base64 PNG, JPEG, GIF, or WebP data URLs up to 3 MB. The server never fetches a user-supplied screenshot URL.
- Generated previews run in sandboxed iframes with a Content Security Policy that blocks network connections, remote assets, forms, plugins, and base-URL changes.
- Security events are emitted as single-line JSON with `"type":"security_event"` and no credentials, request bodies, or screenshot data. Filter for that value in Vercel Runtime Logs and configure Firewall alerts in Vercel for production monitoring.

## Source-of-truth rule

If code, a conversation, or an external tool conflicts with the repository documentation, update the repository documentation first and record the decision in `docs/decisions.md`. Keep the README status aligned with the current blueprint and release plan.

## Agent context workflow

`AGENTS.md` is the canonical entrypoint for any agent working from this repository. Claude Code and GitHub Copilot have small platform-specific instruction files that route back to it; they do not duplicate product decisions. Marketing context lives in `.agents/product-marketing.md`, and ContextBridge includes these files in its shared packets.

Run `npm run context:check` to verify the contract locally. GitHub Actions runs the same check on pull requests and relevant pushes. When adopting another platform that does not discover `AGENTS.md`, add a minimal auto-loaded adapter that points to `AGENTS.md`, then register it with the check and ContextBridge.

<!-- trigger: Vercel preview build for design QA, 2026-08-05T17:34:28Z -->
