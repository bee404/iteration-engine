import { twentyFirstComponentUrl } from "@/lib/providers/patterns";
import type { Direction } from "@/lib/types";

/**
 * Canned directions for the /directions step while real AI generation is out of scope for this
 * design-QA pass. These mirror the exact `Direction` shape the live provider returns, so the
 * screen renders the real production pattern (explanation + tradeoffs + "Grounded in" 21st.dev
 * link) on placeholder content. Each `patternReference.url` is built from a real, verified
 * 21st.dev author/slug via the shared helper, so every link resolves instead of 404ing.
 */
export const PREVIEW_DIRECTIONS: Direction[] = [
  {
    id: "anchor-hero",
    title: "Anchor on one hero moment",
    rationale:
      "Reframe the screen around a single dominant action so the first thing a visitor reads is also the first thing they should do. Everything else steps down in weight to support that one decision.",
    tradeoffs:
      "Commits hard to one primary path — great when there is a clear next step, riskier if the screen genuinely has two co-equal goals.",
    suggestedChanges: [
      "Promote the primary action to a full-width hero with a single headline and supporting line.",
      "Demote secondary links to quiet text actions beneath the fold of attention.",
      "Cut competing surfaces so nothing shares the hero's visual weight.",
    ],
    patternReference: {
      source: "21st.dev",
      name: "Hero section",
      url: twentyFirstComponentUrl("prebuiltui", "hero-section"),
      description: "A focused hero that anchors one dominant call to action against supporting context.",
    },
  },
  {
    id: "scannable-grid",
    title: "Organize choices into a scannable grid",
    rationale:
      "Instead of a single linear column, lay the options out as a modular grid of tiles. Each tile owns one idea, so the eye can triage the set at a glance and drop into whichever path fits.",
    tradeoffs:
      "Reads as calmer and more surveyable, but a grid flattens hierarchy — it works best when the options are genuinely peers rather than an ordered sequence.",
    suggestedChanges: [
      "Group the options into a bento-style grid with one focal tile and smaller supporting tiles.",
      "Give each tile a title, one line of copy, and a single affordance.",
      "Use tile size and contrast (not color) to signal which path is recommended.",
    ],
    patternReference: {
      source: "21st.dev",
      name: "Bento grid",
      url: twentyFirstComponentUrl("designali-in", "bento-grid"),
      description: "A modular tile layout with clear focal points for surveying peer options.",
    },
  },
  {
    id: "surface-system-state",
    title: "Surface progress and system state inline",
    rationale:
      "Keep the current layout but make the system legible: show where the user is, what is done, and what the product is doing right now. Ambiguous status is the real friction, not the arrangement.",
    tradeoffs:
      "Lowest-risk to the existing design and easiest to ship, but it treats the symptom (unclear state) rather than rethinking the entry point itself.",
    suggestedChanges: [
      "Add an explicit step indicator so progress through the flow is always visible.",
      "Give every step a status affordance: done, available, or waiting.",
      "Show an inline processing state while the system is working instead of a blank pause.",
    ],
    patternReference: {
      source: "21st.dev",
      name: "AI thinking block",
      url: twentyFirstComponentUrl("preetsuthar17", "ai-thinking-block"),
      description: "An inline block that makes the system's processing state visible while it works.",
    },
  },
];

