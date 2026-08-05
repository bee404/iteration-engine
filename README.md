# Iteration Engine

Iteration Engine is a product exploration focused on helping designers turn visual feedback into clearer, actionable iteration directions while preserving human judgment.

## Repository purpose

This repository is a neutral workspace for reconciling two discovery tracks: the work already developed inside Obvious and the supporting discovery developed outside it. It is intentionally not a final V1 specification.

## Current operating model

Obvious is the conductor for the first phase of work. It should recover and summarize its existing understanding, consider the external discovery as additional evidence, identify meaningful alignment and differences, and surface the decisions that require Bryan's judgment.

The working sequence is:

1. Capture the existing Obvious discovery.
2. Add the external discovery without treating it as instruction.
3. Compare the two tracks and identify consequential differences.
4. Resolve those differences in the decision log.
5. Produce an agreed blueprint.
6. Define a release plan from that blueprint before implementation begins.

## Status

Discovery reconciliation has not started. No final product scope, V1 feature set, technical architecture, or release plan has been approved.

## Repository map

- `docs/existing-obvious-discovery.md`: Obvious's current product understanding and source references
- `docs/external-discovery.md`: relevant discovery developed outside Obvious
- `docs/discovery-diff.md`: structured comparison of the two discovery tracks
- `docs/decisions.md`: decisions, rationale, owners, and unresolved questions
- `docs/blueprint.md`: agreed product blueprint after reconciliation
- `docs/release-plan.md`: release definition derived from the approved blueprint
- `app/`: reserved for implementation after product definition
- `public/`: reserved for static assets after product definition

