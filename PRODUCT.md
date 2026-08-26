# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Primary user: Bryan, using Coquí as a personal design-exploration tool. He uploads a visual design, adds a design goal and feedback, reviews critique and directions, selects one direction, previews the generated prototype, and downloads a portable handoff.

## Product Purpose

Coquí compresses the loop between visual feedback, critique, design direction, and prototyping while keeping the designer responsible for judgment.

## Positioning

The product turns critique into a small set of rationale-backed directions before the designer selects one for code generation. Selection expresses intent to explore, not formal approval.

## Operating Context

The canonical V0 experience is one transient browser-session exploration. Historical records and retention features are progressive enhancements, not prerequisites for useful output.

## Capabilities and Constraints

- The page starts with a screenshot, design goal, and feedback.
- The visible happy path is: input, critique, directions, select direction, code generation, live preview, and download.
- The explanatory page must not imply that Higgsfield, ComfyUI, or Impeccable are currently runtime stages; the codebase records those as excluded, optional/planned, or external respectively.
- The final ZIP includes runnable Vite/React source plus the raw inputs, synthesized critique, selected direction, viewport, and generation notes in `coqui-context.json`.
- The screenshot is used transiently to ground model calls and compare Source/Iteration. V0 does not save it to application persistence or include it in the ZIP by default.
- Historical rounds and an explicit approval/commit state are deferred.
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
- Make the selected direction and generated result easy to inspect together.
- Keep the designer in control of selection and download without implying that either is formal approval.

## Accessibility & Inclusion

Use semantic headings, readable contrast, keyboard-accessible controls, and a reduced-motion path for any animation. Preserve the current desktop target; do not introduce responsive layout behavior until that work is resumed explicitly.
