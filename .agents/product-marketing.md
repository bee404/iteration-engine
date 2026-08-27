# Product Marketing Context

**Document version:** v5
**Last updated:** 2026-08-26
**Scope:** Launch-ready context for Coquí's first public post, closed-alpha outreach, and eventual open-source release. Long-term positioning, market sizing, and competitive research are intentionally deferred.

## Product Overview

**One-liner:** Coquí helps designers win back time by bringing screenshot-based feedback, critique, direction-setting, and optional prototyping into one guided workflow.

**What it does:** A designer uploads a screen, states the goal, and pastes feedback. Coquí separates real problems from taste, flags ambiguity, returns 2–3 rationale-backed directions, and lets the designer optionally generate and inspect a coded preview before choosing and saving a round.

**Product category:** Design-iteration and decision-support tool.

**Product type:** Standalone desktop-first web application; currently suited to a closed alpha. The intended public release is open source, forkable, and run with the user's own Claude API key.

**Business model:** Open-source distribution is the current direction. Pricing and any hosted offering are not decided. Do not imply paid plans or general availability.

## Target Audience

**Primary user:** Product designers and hands-on design leads who repeatedly turn screenshots and scattered feedback into a clear next design direction.

**Initial user profile:** Designers working on single-screen interface iterations who want faster synthesis without handing final judgment to AI. Closed Alpha A is three trusted friends who match the target profile and will use Coquí on real design work beyond Bryan's own projects. Closed Alpha B will recruit a small external cohort from the tester list created through LinkedIn and the future website. The later self-serve release will be easiest for technical designers, design engineers, and others comfortable forking a repository and supplying an API key.

**Secondary launch audience:** Recruiters and hiring managers evaluating Bryan's ability to identify a workflow problem and design and build a working product. They are viewers of the proof, not the product's primary users.

**Primary use case:** Move from a screenshot and raw feedback to a defensible next direction, with optional interactive prototyping, in one guided round.

**Jobs to be done:**

- Make sense of mixed or vague design feedback.
- Compare a small number of meaningfully different directions before committing.
- Prototype only the directions worth testing and retain the reasoning behind the decision.

## Personas

| Persona | Cares about | Challenge | Value we promise |
|---------|-------------|-----------|------------------|
| Product designer | Time, craft, clarity, control | Feedback synthesis and iteration are fragmented across steps and tools | One guided path from feedback to a considered direction |
| Design lead / player-coach | Decision quality and rationale | Needs to turn stakeholder input into an actionable design decision | Structured critique, tradeoffs, and a reviewable prototype without surrendering judgment |

## Problems & Pain Points

**Core problem:** The work between receiving feedback and reaching a confident next design direction is fragmented and repetitive. Designers must interpret raw comments, separate usability concerns from taste, generate alternatives, explain tradeoffs, prototype, and preserve the decision trail.

**Why alternatives fall short:**

- General chat tools can produce output, but do not provide a designer-centered, repeatable decision flow.
- Immediate one-shot generation can skip critique and collapse judgment into an opaque answer.
- Separate feedback, ideation, prototyping, and history tools add handoffs and context rebuilding.

**What it costs:** Time and focus. Exact savings have not been measured.

**Emotional tension:** Designers want help clearing repetitive synthesis work without outsourcing taste or becoming passive reviewers of AI output.

## Competitive Landscape

**Direct:** Not yet researched enough for public comparison claims.

**Secondary:** General AI chat and UI generation tools. They may help with individual steps, but Coquí's intended advantage is the connected, judgment-first round.

**Indirect:** Manual synthesis across design files, comments, chat, notes, and prototyping tools.

## Differentiation

**Key differentiators:**

- Judgment-first: critique and alternatives come before optional code generation.
- Feedback-aware: separates signal from preference and flags unclear input.
- Bounded choice: presents 2–3 rationale-backed directions with tradeoffs rather than one opaque answer or unlimited variation.
- On-demand fidelity: designers can generate code for zero, one, or several directions before choosing.
- Durable rounds: approved inputs, critique, directions, generated code, and history are persisted together.
- Intended open-source model: users can inspect, fork, adapt, and run Coquí with their own Claude API key once release packaging is complete.

**Implemented but not fully validated:** The fixed-box `Source` / `Iteration` comparison, conditional live 21st.dev grounding, source-bundle export, and GPT-4o fallback are now in the codebase. The complete loop still needs validation against a real project before stronger quality or registration claims are made.

**Why this is better:** It compresses the path from feedback to decision while keeping the designer responsible for what advances.

## Objections

| Objection | Response |
|-----------|----------|
| "Is this another AI tool making design decisions for me?" | No. Coquí structures critique and directions; the designer selects what advances, and code generation is optional. |
| "Will it understand my product and constraints?" | The round accepts a goal, feedback, reviewer context, and constraints, but broader design-system input and real-project validation are still incomplete. |
| "Is it ready for production use?" | Not yet. The honest offer today is a closed alpha around the implemented single-screen workflow. |

**Anti-persona:** Teams seeking autonomous design replacement, production-ready multi-screen generation, mobile workflows, or an enterprise collaboration suite today.

## Switching Dynamics

**Push:** Repeatedly rebuilding context and translating scattered feedback into the next design move.

**Pull:** One focused round that produces structured critique, bounded directions, and optional interactive output.

**Habit:** Existing combinations of Figma, comments, chat, notes, and code-generation tools are familiar and flexible.

**Anxiety:** Loss of creative control, generic AI output, design-system drift, and whether generated code will mount reliably.

## Customer Language

**Current source language:** Repository and founder language only; no external customer interviews yet.

**Words to use:** win back time, design iteration, raw feedback, critique, real problems, taste, directions, rationale, tradeoffs, optional coded preview, designer judgment, guided workflow, closed alpha.

**Words to avoid:** autonomous designer, replaces designers, instant production-ready design, pixel-perfect, proven time savings, enterprise platform, unlimited, one-click magic.

**Glossary:**

| Term | Meaning |
|------|---------|
| Round | One cycle from screenshot and feedback through critique, directions, optional code, and approval |
| Direction | A meaningfully different approach with rationale, tradeoffs, and suggested changes |
| Signal | Feedback pointing to a real design problem |
| Preference | Feedback expressing taste rather than an established problem |
| Iteration | A generated or approved next version of the source screen |

## Brand Voice

**Tone:** Designer-centered, human, direct, calm, and specific.

**Style:** Lead with the recognizable workflow and time reclaimed. Explain AI through useful transformations, not as the hero. Do not open launch copy with generic builder clichés such as "I've been quietly building," "excited to finally share," or adjacent startup-announcement formulas. For the initial launch, do not lead with the Puerto Rico origin story, the water crisis, or culturally specific illustration. Those elements introduce a separate conversation and should be held for later context if Bryan chooses to tell it.

**Personality:** Thoughtful, practical, crafted, transparent.

## Proof Points

**Implemented product proof:**

- Screenshot upload/paste, natural-dimension capture, goal, raw feedback, reviewer context, and constraints.
- Real Claude-generated critique that separates signal from preference and flags ambiguities.
- Real Claude-generated 2–3 distinct directions with rationale, tradeoffs, and suggested changes.
- Optional per-direction streamed code generation and interactive sandboxed preview with source/error fallback.
- Viewport inference, pre-commit correction, chain locking, and fixed-box `Source` / `Iteration` comparison.
- Approved-prototype export as a downloadable source bundle.
- Claude-primary GPT-4o fallback and conditional live 21st.dev pattern grounding when the relevant server keys are configured.
- Approval, Turso persistence, and recent round history.
- Fixture-backed demo mode that replays captured real output with no external calls or writes.

**Visual proof hierarchy:**

1. The input transition: uploaded screen beside a concise design brief.
2. The critique: `Signal — real problems` versus `Preference — taste`, plus ambiguity flags.
3. The direction decision: 2–3 distinct direction cards with rationale and tradeoffs.
4. The optional coded preview opening from a direction.
5. A saved-round confirmation or history view, if the story needs a closing frame.

For the first launch visuals, favor product UI and neutral or permission-safe source screens. Avoid leading with the existing Puerto Rico and water-crisis illustration set.

**Validation:** 110 automated tests pass as of 2026-08-26, including access-control, burst-limit, screenshot-validation, preview-security, provider fallback, viewport, comparison, export, and generation-path coverage. The production build passes; lint passes with one known font-loading warning. The complete loop has not yet been validated across the planned Alpha A real-world use cases.

## Goals

**Immediate business goal:** Establish a credible first public signal while running a staged closed alpha. Alpha A is a controlled cohort of three trusted target users testing real design use cases on Bryan's hosted Claude-backed instance. Alpha B admits a small group from the public tester list only after reviewing Alpha A usage and completing another deep security QA pass.

**Primary conversion action:** For the first post, invite qualified designers to join the Alpha B testers list. The post should explain that access is intentionally limited and staged, without discussing Bryan's API credentials or presenting security work as complete. For the later open-source release, the primary action should become fork the repository and add your own Claude API key.

**Owned channel direction:** A small Obsidian53 website will eventually provide the tester-list signup and a home for Coquí. Its intended feel is high-end, boutique, modern agency. Website architecture and copy are deferred until that project is explicitly started.

**Current metrics:** None. Do not invent adoption, quality, speed, or time-saved metrics.

## Public Positioning Statement

Coquí is a design-iteration tool that turns a screenshot and raw feedback into a structured critique, a few rationale-backed directions, and an optional coded preview, helping designers move from feedback to a decision in one guided flow.

## Claims Boundary

**Safe today:** The implemented single-screen workflow, designer-controlled direction choice, real critique and directions, optional coded preview, fixed-box `Source` / `Iteration` comparison, source-bundle export, demo mode, persisted rounds/history, the staged Closed Alpha A/B plan, and the stated intent to release Coquí as open source and bring-your-own-key. Live 21st.dev grounding and GPT-4o fallback are implemented conditionally when their server-side keys are configured.

**Avoid until proven or released:** Saying the open-source release is available now; quantified time savings; superior output quality; production-ready code; pixel-perfect or perfectly registered results; general design-system adherence; multi-screen workflows; closed-beta maturity; customer adoption or satisfaction; enterprise readiness; or implying that live provider integrations are available without their server-side configuration.

## Launch-Blocking Questions

No positioning question materially blocks a scoped first public post or closed-alpha announcement today. The first-post CTA is now settled: join the Alpha B testers list. Three operational choices still affect the visuals and later open-source release:

1. Will the public proof be a controlled fixture-backed recording or a live connected demo?
2. Which real or permission-safe screen and feedback example should appear in the visuals?
3. Before calling it open source and fork-ready, choose a license and add a public setup path covering installation, the Claude key, local persistence, and known product limits. The repository already has an environment-variable example, but no license or contributor-facing setup guide was found.

## Changelog

- v5 (2026-08-26) — Reconciled public proof and claims with the shipped viewport comparison, export, provider fallback, and conditional 21st.dev grounding; updated verification counts and retained real-project validation as the remaining evidence gate.
- v4 (2026-08-22) — Defined Closed Alpha A as three trusted target users, made a deep security QA pass the gate to public-list Alpha B, added the future Obsidian53 owned-channel direction, and prohibited generic "quietly building" launch openings.
- v3 (2026-08-21) — Set the first-post CTA to a small alpha testers list and defined the cohort's purpose as testing Coquí against real use cases beyond Bryan's own work.
- v2 (2026-08-21) — Added open-source, forkable, bring-your-own-Claude-key release direction; pulled Puerto Rico, water-crisis, and illustration-led storytelling out of the initial launch frame.
- v1 (2026-08-21) — Initial launch-scoped context drafted from repository product decisions, implemented UI, release boundaries, and verification.
