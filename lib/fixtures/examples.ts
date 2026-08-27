import type { DemoFixture } from "./types";
import { hightouchOnboardingCode } from "./data/hightouch-onboarding.code";

/** Model tag shown on replayed critiques, honest that this is a captured replay, not a live call. */
const CAPTURED_MODEL = "claude-sonnet (captured · demo replay)";

/**
 * Real captured example #1 — the "Get started with Hightouch" onboarding round.
 *
 * Provenance:
 *  - inputs + critique/direction framing: the real Test 1 scenario in "PR #3 Design QA Test
 *    Plan" (art_cxi3yTtJ). designGoal / feedbackText / reviewerContext / constraints are the
 *    verbatim captured inputs; the critique separates the concrete hierarchy/status problems
 *    (signal) from the "warmer / more premium" taste ask (preference) and flags the vague part,
 *    exactly as that test expects.
 *  - the code for the "Make the next action unmistakable" direction is the VERBATIM real
 *    code-gen output from that run (ie-output1-temp-app.tsx) — it implements precisely this
 *    direction: a black-bordered warehouse card as the unambiguous next step, teammates demoted
 *    to a secondary underline action, destinations locked/dimmed, ring status indicators, and
 *    Vercel-Geist ink-on-white tokens.
 *
 * The demo reuses that one verbatim code capture for all three selectable directions. This is an
 * intentional QA affordance: every path reaches Step 5, the Source / Iteration comparison, and
 * the downloadable payload even though only the first direction has direction-specific captured
 * code. The selected direction metadata remains distinct and is preserved in coqui-context.json.
 */
const hightouchOnboarding: DemoFixture = {
  id: "hightouch-onboarding",
  label: "Get started with Hightouch — onboarding",
  provenance:
    "PR #3 Design QA Test Plan (art_cxi3yTtJ) Test 1 inputs; one verbatim codegen capture (ie-output1-temp-app.tsx) reused across all three demo selection paths.",
  inputs: {
    designGoal:
      "Help a brand-new workspace admin understand the next onboarding action and complete setup without needing support.",
    feedbackText:
      "The page makes the next step unclear. Invite teammates is the only card that looks active, but the other setup steps are muted and it is hard to tell whether Connect to your data warehouse is complete, disabled, or waiting for an action. The help card on the right competes with the main checklist. I also think the page should feel warmer, more polished, and more premium.",
    reviewerContext:
      "Product designer reviewing the first-run onboarding experience with activation in mind.",
    constraints:
      "Preserve the three-step checklist, the support card, and Hightouch's existing visual language. Do not invent new onboarding destinations.",
  },
  critique: {
    summary:
      "The onboarding page's biggest problem is that the next action isn't legible: the only visually active card isn't the first real step, and step status is ambiguous. Those are concrete hierarchy and state problems worth fixing before any stylistic pass. The request to feel 'warmer / more premium' is real but is a taste preference, not a usability defect — and 'premium' is too vague to act on without an example.",
    signal: [
      {
        kind: "signal",
        text: "\"Invite teammates\" is the only card that reads as active, so the eye lands there instead of on the actual first step (Connect to your data warehouse).",
      },
      {
        kind: "signal",
        text: "\"Connect to your data warehouse\" has no status affordance — it's impossible to tell whether it's complete, disabled, or waiting on the user.",
      },
      {
        kind: "signal",
        text: "The support/help card on the right competes visually with the primary checklist, splitting attention away from the setup path.",
      },
    ],
    preference: [
      {
        kind: "preference",
        text: "\"Warmer, more polished, more premium\" is a stylistic preference about overall feel, not a specific usability problem to solve.",
      },
    ],
    flaggedAmbiguities: [
      "\"More premium\" isn't specific enough to act on — a reference screen or one concrete attribute (type, spacing, color) would make it actionable rather than guessed at.",
    ],
    model: CAPTURED_MODEL,
  },
  directions: [
    {
      direction: {
        id: "hightouch-next-action",
        title: "Make the next action unmistakable",
        rationale:
          "Directly answers the signal items: give the first real step (Connect to your data warehouse) a primary, bordered treatment so it reads as the obvious next action, add an explicit status ring to every step, demote Invite teammates to a secondary underline action, and lock/dim steps that aren't available yet. Preserves the three-step checklist and support card per the constraints.",
        tradeoffs:
          "Leans on a single strong emphasis; if more steps are added later the 'one obvious next action' framing needs revisiting.",
        suggestedChanges: [
          "Give the active first step a 1px near-black border so it reads as primary; keep the others on the hairline border.",
          "Add a status ring per step (filled = done, outline = available, dimmed = locked) to remove the complete/disabled/waiting ambiguity.",
          "Demote Invite teammates to a secondary underline action so it stops out-competing the first step.",
          "Dim and lock the destinations step until its prerequisite is met.",
        ],
        patternReference: null,
      },
      capturedCode: hightouchOnboardingCode,
    },
    {
      direction: {
        id: "hightouch-separate-guidance",
        title: "Separate guidance from the task",
        rationale:
          "Targets the competing-help-card signal: pull the support card out of the main column into a quieter secondary position so the checklist owns the primary reading path, without removing the support affordance the constraints require keeping.",
        tradeoffs:
          "Moving help further from the task can make it slightly less discoverable for users who do get stuck.",
        suggestedChanges: [
          "Move the support card below or to a de-emphasized rail so it no longer competes with the checklist.",
          "Reduce the support card's visual weight (lighter surface, smaller heading).",
          "Keep a persistent but quiet 'need help?' entry so the affordance is preserved.",
        ],
        patternReference: null,
      },
      capturedCode: hightouchOnboardingCode,
    },
    {
      direction: {
        id: "hightouch-progress-framing",
        title: "Add momentum with progress framing",
        rationale:
          "Addresses the 'warmer / more premium / more energy' preference through structure rather than decoration: a step counter and progress framing give a sense of momentum and polish while staying inside the existing visual language.",
        tradeoffs:
          "Progress framing implies a fixed, ordered path; it fits worse if steps become optional or reorderable.",
        suggestedChanges: [
          "Add a '1 of 3' style step counter and a slim progress indicator above the checklist.",
          "Introduce a brief encouraging subhead that reinforces forward momentum.",
          "Use restrained motion on step completion to add polish without new color.",
        ],
        patternReference: null,
      },
      capturedCode: hightouchOnboardingCode,
    },
  ],
};

/** The fixture replayed when DEMO_FIXTURE is unset or unknown. */
const DEFAULT_FIXTURE = hightouchOnboarding;

/** Registry of all captured demo fixtures. Append new examples here — nothing else changes. */
const FIXTURES: readonly DemoFixture[] = [DEFAULT_FIXTURE];

export function listFixtures(): readonly DemoFixture[] {
  return FIXTURES;
}

/**
 * The fixture demo mode replays. Selectable via DEMO_FIXTURE=<id>; defaults to the first
 * registered fixture. An unknown id falls back to the default rather than failing the flow.
 */
export function getActiveFixture(): DemoFixture {
  const requested = process.env.DEMO_FIXTURE?.trim();
  if (requested) {
    const match = FIXTURES.find((f) => f.id === requested);
    if (match) return match;
  }
  return DEFAULT_FIXTURE;
}

/** Look up a captured direction within the active fixture by direction id. */
export function findCapturedDirection(directionId: string) {
  return getActiveFixture().directions.find((d) => d.direction.id === directionId);
}
