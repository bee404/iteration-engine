# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Primary user: Bryan, using Coquí as a personal design-iteration tool. He uploads a visual design, adds a design goal and feedback, reviews critique and directions, optionally generates code, previews the result, and saves an approved round.

## Product Purpose

Coquí compresses the loop between visual feedback, critique, design direction, and iteration while keeping the designer responsible for judgment. The happy-path workflow page should make that loop immediately understandable, beginning with the screenshot as the object being iterated.

## Positioning

The product turns critique into a small set of rationale-backed iteration directions before optional code generation, rather than treating AI as the final decision-maker or producing one opaque regenerated prototype.

## Operating Context

The workflow page is a separate explanatory surface inside the existing Coquí application. It should show the happy path only for now, with a later surface available for fallback and failure states. The page should use the repository's current visual system and keep copy concise.

## Capabilities and Constraints

- The page starts with a screenshot, design goal, and feedback.
- The visible happy path is: input, critique, directions, optional code generation, live preview, approval, and save.
- The explanatory page must not imply that Higgsfield, ComfyUI, or Impeccable are currently runtime stages; the codebase records those as excluded, optional/planned, or external respectively.
- Current code saves approved rounds to Turso. The approved V1 export is a downloadable source bundle; that download is planned but not yet implemented.
- The current design target is desktop-only at approximately 1241px. Responsive and touch adaptations are deferred until the visual direction and remaining screens are stable.
- Preserve the existing Coquí visual system in `DESIGN.md`.

## Brand Commitments

Product name: Coquí. Preserve the existing atmospheric ground, floating white cards, warm display headings, Figtree body text, and single gold committing action.

## Evidence on Hand

- Existing implementation in this repository.
- `DESIGN.md` and `docs/design-system.md`.
- `docs/blueprint.md`, `docs/decisions.md`, and `docs/release-plan.md`.

## Product Principles

- Start with the visual artifact and keep it central.
- Show AI as a sequence of useful transformations, not as an opaque authority.
- Keep the happy path legible at a glance.
- Make optional code generation visibly optional.
- Keep the designer's approval as the committing moment.

## Accessibility & Inclusion

Use semantic headings, readable contrast, keyboard-accessible controls, and a reduced-motion path for any animation. Preserve the current desktop target; do not introduce responsive layout behavior until that work is resumed explicitly.
