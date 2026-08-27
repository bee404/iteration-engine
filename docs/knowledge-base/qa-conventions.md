# QA & PR-Review Conventions

The review discipline this project follows. Read before opening any PR. These conventions come
directly from how Bryan runs design QA — they are not optional niceties.

## The core rule: every PR ships with a preview link and explicit "what to look for"

Bryan reviews PRs before they merge — he does the design QA pass himself. Two things must be true
of every PR you open so he can actually do that:

1. **A clearly visible preview/diff link as plain text**, labeled (e.g. `Preview link → <url>`
   or `Review this PR → <url>`). Do **not** rely on GitHub's or Vercel's default button — a bare
   button is easy to miss. Put the link in the PR body as readable text.
2. **Explicit design-QA guidance** — a short, specific list of *what to look at* in this change:
   the states to exercise, the exact things that should look or behave a certain way, and the
   known gaps that are intentionally out of scope. "Please review" is not guidance.

This mirrors the standing project preference: whenever there's a PR to preview, include what to
QA and make the link impossible to miss.

## Design QA before merge

- Nothing merges on green CI alone. A human design-QA pass gates the merge.
- Frame QA guidance around the **user-visible states**, including off-happy-path ones: empty,
  loading, partial/streaming, error. The visual-diff blueprint and the PR #3 test plan both
  treat these explicitly — follow that standard.
- When a change intentionally leaves something unaddressed, **say so** under a "Known gap, not
  fixed here" note so the reviewer doesn't flag it as a defect.

## The test-plan pattern (see the PR #3 Design QA Test Plan)

The established shape for a QA plan, per numbered test:

- **What changed** — one or two sentences on the actual code delta.
- **Setup** — how to reach the state (e.g. "run a round to the directions step, click Generate
  code").
- **What to look for (the design-QA focus)** — the concrete, checkable expectations.
- **Error case** — what a graceful failure looks like (clear inline error, never a raw 500 or a
  spinner stuck forever).
- **Known gap / limitation** — what this PR deliberately does not fix.
- **Result** — left `pending` until the QA pass fills it in.

## Automated regression gates

Where behavior is codified, back the manual pass with an automated check and cite it in the PR:

- `npm run verify:codegen` — codegen post-processing regression against the real Test-1 capture
  fixture. Must report **12/12** (one sanity check + the nine codified design-system fix-ups).
  Any FAIL is a QA failure.
- `npm test` — unit tests (`lib/**/*.test.ts`), including the pure preview-document builder.
- `npm run lint` — run before every commit. Do **not** run `tsc` in-sandbox (CI covers types).

## DEMO_MODE for offline QA passes

Front-end/UX QA runs against `DEMO_MODE=true`, which replays real captured outputs with zero API
cost. Use it to exercise the full flow deterministically. When a PR touches the flow, note whether
it was QA'd in demo mode, live, or both. The canonical V0 has no application persistence path.

## Lean working path

Build directly; skip the full Impeccable review chain (an external, local design-critique tool
Bryan runs outside this repo) unless he explicitly asks for it. Adopted 2026-08-09, driven by
token cost — the review apparatus cost several times more than the build itself. This does not
lower the design-QA bar above; it only means a formal automated critique pass is opt-in, not a
default gate.

## PR hygiene for this repo

- Branch from `main`; never push to `main` directly. Use `--squash` to merge.
- Conventional-commit prefixes (`feat:`, `fix:`, `refactor:`, `docs:`, `test:`).
- Keep the PR title/body describing what is *actually* shipping — update them if scope shifts.
- Repo source-of-truth rule: if code, a conversation, or an external tool conflicts with the
  repo docs, update the docs first and record the decision in `docs/decisions.md`. Keep the
  README status aligned. (This knowledge base is a synthesis layer — correct it in the same PR
  when you find it drifting.)
