# Iteration Engine — Knowledge Base

A single, token-conservative reference hub for **any** AI coding agent working on this
repository (Obvious, Codex, Claude Code, or otherwise). It is plain markdown committed into
the repo so it can be read straight from the checkout — no API calls, no external service, no
credentials.

## What this is (and is not)

- **Is:** a distilled synthesis of the durable decisions, shipped architecture, and open work
  for Iteration Engine. Conclusions, not research trails.
- **Is not:** a raw dump of every research doc. The original research artifacts live in the
  Obvious project; this hub captures only what a coding agent needs to make correct changes.

## How to use it

Read the one file that matches your task, not all of them:

| File | Read it when you need to know… |
| --- | --- |
| [`architecture.md`](./architecture.md) | How the shipped system actually works — pipeline stages, provider interfaces, data model, persistence, demo mode, live-mount preview, design-system enforcement. Start here for any code change. |
| [`decisions.md`](./decisions.md) | *Why* the system is built the way it is — the durable, load-bearing decisions and their rationale (generation engine, token format, Sucrase, demo mode, 21st.dev shape, etc.). Read before changing a decision. |
| [`roadmap-and-open-work.md`](./roadmap-and-open-work.md) | What is built vs. designed-but-not-built (the before/after visual diff), build-order dependencies, and the paused external UX iteration work. |
| [`qa-conventions.md`](./qa-conventions.md) | The PR-review and design-QA pattern this project follows before anything merges. Read before opening a PR. |

## Ground truth precedence

This hub summarizes; it does not replace the repo's own product docs. When they conflict, the
primary source-of-truth docs win, in this order:

1. **Code** on `main` — the actual shipped behavior.
2. [`docs/decisions.md`](../decisions.md), [`docs/blueprint.md`](../blueprint.md),
   [`docs/release-plan.md`](../release-plan.md) — the reconciled product source of truth.
3. This knowledge base — a navigational synthesis layered on top of the above.

If you find this hub drifting from code or the primary docs, correct it in the same PR that
surfaces the drift.

## One-paragraph orientation

Iteration Engine is a personal, single-user design tool: a designer uploads a screenshot plus
feedback, and the app produces a critique (signal separated from preference), 2–3
rationale-backed directions, and on-demand per-direction code generation that live-mounts as an
interactive React component. Rounds persist to Turso for version history. It is a Next.js app
on Vercel, Zustand for client state, Claude Sonnet behind typed provider interfaces (with mock
and fixture fallbacks), Sucrase for in-browser transpilation, and a design-system enforcement
pipeline that grounds generated code in the Vercel Geist style. See `architecture.md` for
detail.

