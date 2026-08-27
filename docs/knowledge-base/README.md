# Coquí — Knowledge Base

A single, token-conservative reference hub for **any** AI coding agent working on this
repository (Obvious, Codex, Claude Code, or otherwise). It is plain markdown committed into
the repo so it can be read straight from the checkout — no API calls, no external service, no
credentials.

## What this is (and is not)

- **Is:** a distilled synthesis of the durable decisions, shipped architecture, and open work
  for Coquí. Conclusions, not research trails.
- **Is not:** a raw dump of every research doc. The original research artifacts live in the
  Obvious project; this hub captures only what a coding agent needs to make correct changes.

## How to use it

Read the one file that matches your task, not all of them:

| File | Read it when you need to know… |
| --- | --- |
| [`.agents/product-marketing.md`](../../.agents/product-marketing.md) | How Coquí is positioned publicly, who the initial audience is, what claims are defensible, and what the current launch CTA is. Read before writing marketing, launch, recruiting, or public-facing product copy. |
| [`architecture.md`](./architecture.md) | How the current system works — pipeline stages, provider interfaces, transient state, portable export, demo mode, and live-mount preview. Start here for any code change. |
| [`decisions.md`](./decisions.md) | *Why* the system is built the way it is — the durable, load-bearing decisions and their rationale (generation engine, token format, Sucrase, demo mode, 21st.dev shape, etc.). Read before changing a decision. |
| [`roadmap-and-open-work.md`](./roadmap-and-open-work.md) | What is built vs. still open (including remaining viewport precision work), build-order dependencies, and the paused external UX iteration work. |
| [`qa-conventions.md`](./qa-conventions.md) | The PR-review and design-QA pattern this project follows before anything merges. Read before opening a PR. |
| [`../design-system.md`](../design-system.md) | Coquí's own visual identity, naming, brand assets, copy voice, and design history — distinct from the Vercel Geist system this hub's `architecture.md` covers, which grounds only *generated* code. Read before any UI/visual change to the app shell itself. |

## Ground truth precedence

This hub summarizes; it does not replace the repo's own product docs. When they conflict, the
primary source-of-truth docs win, in this order:

1. **Code** on `main` — the actual shipped behavior.
2. [`docs/decisions.md`](../decisions.md), [`docs/blueprint.md`](../blueprint.md),
   [`docs/release-plan.md`](../release-plan.md), [`docs/design-system.md`](../design-system.md),
   and the repo-root `DESIGN.md` — the reconciled product and visual source of truth.
3. This knowledge base — a navigational synthesis layered on top of the above.

For public messaging, `.agents/product-marketing.md` is the canonical interpretation of those
product facts. It may narrow what is safe to claim, but it does not override shipped behavior or
the decision log.

If you find this hub drifting from code or the primary docs, correct it in the same PR that
surfaces the drift.

## One-paragraph orientation

**Coquí** (renamed 2026-08-11 from "Iteration Engine" — see `docs/decisions.md` Decision 8; the
repo slug and this hub's older prose still say the old name in places) is a personal, single-user
design tool: a designer uploads a screenshot plus feedback, and the app produces a critique
(signal separated from preference), 2–3 rationale-backed directions, and a generated prototype
for the selected direction that live-mounts as an interactive React component. V0 state is
transient; the durable artifact is a context-rich ZIP owned by the user. It is a Next.js app on Vercel, Zustand for client state, Claude Sonnet behind
typed provider interfaces (with mock and fixture fallbacks), Sucrase for in-browser
transpilation, and a design-system enforcement pipeline that grounds *generated* code in the
Vercel Geist style. See `architecture.md` for that detail, and `docs/design-system.md` for the
app's own — unrelated — gold-accent visual identity.
