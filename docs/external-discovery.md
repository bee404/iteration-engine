# External Discovery

## Purpose

Capture relevant Iteration Engine discovery developed outside Obvious as evidence to be evaluated, not as instructions or an approved specification.

## Status

Reviewed and reconciled — see `discovery-diff.md` for the comparison and `decisions.md` for how each item was resolved.

## Source material

Supplied directly by Bryan, August 2026.

### Framing (as supplied)

> Iteration Engine is a design workflow system intended to compress the loop between critique, direction, exploration, and evaluation. It should not replace designer judgment or present AI as the final decision-maker. The designer should remain responsible for selecting directions, evaluating quality, applying taste, and deciding what advances.

### Product principles

- The designer remains responsible for selecting directions, evaluating quality, applying taste, and deciding what advances — AI is never the final decision-maker.
- The value is not simply generating more designs. It is helping a designer understand feedback, separate signal from preference, explore meaningfully different directions, compare options, preserve intent, maintain control over quality, and move through iteration faster without surrendering judgment.
- The system should avoid producing shallow visual variation that looks different but does not represent a different design decision.

### Working hypotheses

- Compressing the critique → direction → exploration → evaluation loop is itself the source of value, more than the artifact (code/mockup) produced at the end of it.
- Designers currently struggle to separate "signal" (feedback that reflects a real problem) from "preference" (feedback that reflects taste) — making that distinction explicit may be valuable independent of what gets generated afterward.

### Workflow proposals (explicitly proposals, not requirements)

**Inputs discussed:** a screenshot or other visual design source; a design goal; raw feedback; optional reviewer perspective or context; potentially additional references, requirements, or constraints.

**Outputs discussed:** a concise critique of the current design; several meaningfully different iteration directions; rationale for each direction; tradeoffs; suggested design changes; generation or implementation instructions; a way to compare the original and resulting iterations.

### Technical possibilities (explicitly discussed, none required or pre-selected)

- Obvious as the conductor and build environment
- Vercel as a possible deployment target
- Next.js as a possible application framework
- Figma as an input, reference, or output environment
- 21st.dev as a possible source for components or interface references
- Higgsfield as a possible generation layer
- Claude or OpenAI models for critique, reasoning, and structured outputs
- Local generation tooling as a possible later direction

### Release suggestions

None specific to Iteration Engine were supplied in the external discovery itself. Bryan's operating instructions for this reconciliation (not part of the external discovery, but relevant context) added meta-guidance: do not optimize solely for an interview demo; do not over-index on reducing scope before establishing what the release needs to prove; recommend the most meaningful release that can be built reliably under actual constraints, not necessarily the smallest possible interface.
