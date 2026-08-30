# Coquí Repository Context

These instructions apply to every agent working in this repository.

## Start with the relevant source of truth

- For product definition and current behavior, read `README.md`, `PRODUCT.md`, and the implementation.
- Before changing product direction, read `docs/decisions.md`, `docs/blueprint.md`, and `docs/release-plan.md`.
- Before writing marketing, launch, recruiting, or other public-facing product copy, read `.agents/product-marketing.md`.
- Before changing Coquí's interface or visual language, read `DESIGN.md` and `docs/design-system.md`.
- For implementation routing, read `docs/knowledge-base/README.md` and then only the task-relevant knowledge-base files.

## Evidence rules

- Distinguish implemented, validated, planned, and exploratory work.
- Do not present planned capabilities as shipped.
- Do not invent customer evidence, metrics, time savings, adoption, or product performance.
- Keep Coquí designer-centered. AI supports critique and iteration; the designer decides what advances.
- The initial public message should focus on the workflow and its usefulness. Do not lead with the Puerto Rico origin story, water crisis, or culturally specific illustration.
- The intended distribution model is open source, forkable, and bring-your-own-Claude-key, but do not say the open-source release is available until licensing and public setup are complete.

## Updating shared context

When an approved product or positioning decision changes, update its canonical document in the same change. Substantive edits to `.agents/product-marketing.md` must increment its document version and prepend a dated changelog entry.

GitHub is the durable authority. ContextBridge may transport repository changes to other tools, but it does not override committed source files.

## Platform adapter contract

`AGENTS.md` is the canonical entrypoint. Platform-specific instruction files must only point back here and add no competing product rules.

Run `npm run context:check` after changing shared context. CI runs the same check on every pull request and relevant push. The check verifies that required source files exist, registered platform adapters reference `AGENTS.md`, the marketing document's version matches its newest changelog entry, and ContextBridge scans every entrypoint.

When adding a platform that does not discover `AGENTS.md`, add the smallest instruction file that platform loads automatically, tell it to read and follow `AGENTS.md`, then register that adapter in `scripts/check-agent-context.mjs` and `contextbridge/config.json`.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
