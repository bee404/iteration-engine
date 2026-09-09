# Coquí direction-detail continuity prototype

This is the durable source for the standalone four-step Vite prototype originally built in a
Codex visualization workspace and deployed to `coqui-direction-detail-trimmed.vercel.app`.
It is a design-review artifact, not the production Next.js application. Repository-root
`AGENTS.md` remains the canonical instruction entrypoint.

The tracked copy intentionally excludes deployment linkage, environment files, generated build
output, dependencies, and historical QA screenshots. Run `npm ci`, `npm run build`, and
`npm run test:sites` from this directory. Deployment remains an explicit approval step.

## Prototype decisions

## Current design decisions

- This prototype now extends the approved direction-detail language across a four-step continuity study. The production repository remains unchanged.
- Preserve one visual grammar across the flow, but do not force every step into the same layout: Step 1 is an intake field, Step 2 is a screenshot-plus-writing workspace, Step 3 is a document-like synthesis, and Step 4 is the approved direction dossier.
- On Step 1, there is no source screenshot yet. Make the upload field the dominant interaction and keep explanatory content subordinate.
- On Step 2, the source screenshot is the working object. Keep it prominent, preserve its 1440:1035 aspect ratio, and place the full real demo inputs beside it without nested scroll areas.
- Do not also show the minified source in the Step 2 header. On the transition into Step 3, animate the working screenshot into the compact header disclosure so its change in role is legible.
- On Step 3, the source no longer changes. Collapse it into the header and let the exact saved critique become the document. Separate signal, preference, and ambiguity without confidence scores, analysis-model labels, or invented metadata. The left rail is a provenance frame for the original goal and constraint, not a second content navigation or analysis panel.
- Step 3 uses the same fixed-height workspace model as Step 4: the synthesized document scrolls independently above a pinned completion footer, with trailing clearance so the final content can scroll fully above the footer.
- The Step 3 recap is an exploratory continuity view based on the desired conceptual flow; the currently shipped path skips that standalone recap route.
- Reserve banana for committed actions, active step/status cues, and small moments of emphasis.
- The compact source disclosure uses a quiet filled surface, light border, and rounded corners as its click affordance. Do not add a leading divider or maximize icon.
- The round title has no edit icon. Hover changes the title treatment and reveals a delayed tooltip reading `Click to change the round name.`
- Session history exposes a simple back control near the round title. Earlier steps are read-only and cannot resubmit or regenerate the round.
- In Step 4, omit the direction count, remove the last direction row's bottom border, and keep direction details in a fixed-height scroll area above a pinned action footer. Leave enough trailing scroll space that the last content clears the footer.
- Until direction choice is persisted, use `Export this direction` instead of a selection CTA.
- Use only the implemented `Direction` fields: title, rationale, trade-offs, suggested changes, and an optional pattern reference.
- Never add analysis-model labels, confidence scores, premise/rationale tabs, decisions, changes-applied, or unchanged sections.
- Preserve the supplied screenshot as an immutable source asset with its original aspect ratio, color, and content, but keep it collapsed by default on the direction-selection step.
- Use Coquí's Obsidian53 palette. Instrument Serif is the display face; Figtree carries body, labels, metadata, fields, and actions.
- Use the supplied `wordmark-light-solid.svg` asset in the dark primary header with no filter, recoloring, or SVG modification.
- Keep the primary header as a flat datum line on the page surface: no raised container, radius, shadow, or competing panel treatment.
- The header identity sequence is Coquí lockup, editable round name, and compact step marker. Do not restore the Obsidian/theme prefix.
- Put the round's original screenshot disclosure at the right edge of the primary header. Keep it minified by default, use the rounded container itself as the click affordance without an expand icon, and preserve the full screenshot's aspect ratio when opened.
- Direction-detail density must use the saved demo fixture as its baseline. Do not shorten or invent rationale, suggested changes, or trade-offs to make the composition fit.
- The active direction row must meet the detail pane at the shared divider and surface treatment; do not rely on a directional arrow alone to explain which direction is open.
- Every direction shows its typed 21st.dev grounding when present. Generate code is per-direction and opens the fixed-viewport Source/Iteration bottom sheet; the demo exposes the captured Direction 01 result and an honest no-capture error for Directions 02 and 03.
- The fixed comparison frame may size the rendered iteration, but it must not override that iteration's own layout mode. In particular, preserve the generated app's desktop grid at the 1440 × 1035 comparison viewport so Source and Iteration can be toggled as registered, like-for-like frames.
- Direction rationale may wrap across multiple paragraphs when the generated explanation warrants it. A compact `From this round` projection can tie the active direction back to existing goal, critique signal/preference, and constraint inputs; it is a display treatment, not a new persisted `Direction` field.
- The round name replaces the theme/project prefix. It is editable, has a 3-character minimum and 20-character maximum, and exposes live count/validation feedback. The title uses a hover/focus treatment and delayed explanatory tooltip instead of an edit icon. Inline edits save only through the checkmark button; Escape cancels. Sanitize to Unicode letters, marks, numbers, spaces, apostrophes, ampersands, periods, and hyphens before rendering.
- Use a compact `STP04` marker for this view with a tooltip that resolves it to `Step 4 · Choose a direction`.
- Prefer open grid alignment and confident rules over boxed panels. Previewing and selecting remain distinct actions.

Run the local server yourself and open the preview in the browser available to this environment. Do not give the user server-start instructions when you can run it.

Before making substantial visual changes, use the Product Design plugin's `get-context` skill when the visual source is unclear or no longer matches the current goal. When the user gives durable prototype-specific design feedback, preferences, or decisions, record them in `AGENTS.md`.

When implementing from a selected generated mock, treat that image as the source of truth for layout, component anatomy, density, spacing, color, typography, visible content, and hierarchy.

Build app UI in `src/`. Keep `.openai/hosting.json`, `worker/index.js`, `scripts/prepare-sites-build.mjs`, and `tests/sites-worker.test.mjs` intact so the same local prototype can be handed to Sites. Before a Sites handoff, run `npm run build` and `npm run test:sites`; the build must leave `dist/client/index.html`, `dist/server/index.js`, and `dist/.openai/hosting.json`.
