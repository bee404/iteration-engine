# Step 5 bounded comparison canvas: design QA

final result: passed

## Scope

- Route: `/prototype`
- State: demo-mode round with a 1440 × 900 source viewport and completed generated prototype
- Desktop QA sizes: 1687 × 1130 app viewport and 1241 × 800 app viewport
- Visual reference: the user-reported Step 5 screenshot plus a same-state failed implementation pass that reproduced the parent-scroll clipping

## Comparison

- Combined failed-pass versus final-state evidence: `design-review/qa/step5-failed-vs-final.png`
- Final top state: `design-review/qa/step5-bounded-final-top.png`
- Final scrolled actions state: `design-review/qa/step5-bounded-final-actions.png`
- Smaller desktop state: `design-review/qa/step5-bounded-1241x800.png`

The original clipboard attachment was no longer present on disk when this report was written. The failed-pass capture uses the same generated prototype, route, app viewport, and 1440 × 900 comparison viewport; it visibly preserves the clipping mode found during implementation QA.

## Findings and fixes

### P1 — fixed: the bounded stage still lived inside a clipped page body

The initial stage-height fix stopped the screenshot and generated code from expanding the comparison canvas, but the fixed app chrome still clipped the Step 5 header and final actions. The Step 5 body now owns app-level vertical scrolling with `flex: 1`, `min-height: 0`, and `overflow-y: auto`.

### P1 — fixed: source dimensions could determine the page height

The comparison stage previously flexed to the rendered source or iteration height. It now has an explicit responsive height (`clamp(480px, 68dvh, 720px)`), clips its own paint, and always fits the selected source viewport inside that box without upscaling it.

## Final checks

- The Step 5 heading, description, segmented control, and bounded comparison frame are visible together at the top of the page.
- The page scroll reaches the warnings, download action, restart action, and storage note without moving the generated prototype outside its frame.
- Source and Iteration use the same fitted frame size.
- The generated iframe remains interactive after switching Source → Iteration; the primary generated control was clicked successfully.
- No browser console errors were observed.
- At 1241 × 800, the 1440 × 900 prototype is fitted proportionally inside the available canvas and the Step 5 body remains independently scrollable.

## Known limitation

The deterministic demo fixture does not contain enough vertical content to demonstrate an inner iframe scrollbar. The frame boundary, iframe containment, state switching, and iframe interaction were exercised; naturally overflowing generated content should receive a focused regression pass when such a fixture is added.
