import type { PatternProvider, PatternQuery, PatternQueryResult } from "./types";

/**
 * Typed mock standing in for the live 21st.dev MCP query. TWENTYFIRST_API_KEY is not
 * configured yet, so this returns a fixed set of plausible pattern references. Replace
 * with a TwentyFirstProvider that calls https://21st.dev/api/mcp at generation time
 * once the key is available — no caller needs to change, since both implement
 * PatternProvider.
 */
export class MockPatternProvider implements PatternProvider {
  readonly name = "mock-21st-dev";

  async findPatterns(query: PatternQuery): Promise<PatternQueryResult> {
    const seed = query.query || query.designGoal || "layout";
    const limit = query.limit ?? 3;

    const catalogue = [
      {
        source: "21st.dev" as const,
        name: "Stacked action bar",
        url: "https://21st.dev/pattern/stacked-action-bar",
        description: `Comparable pattern for "${seed}": groups primary/secondary actions with a clear weight hierarchy.`,
      },
      {
        source: "21st.dev" as const,
        name: "Progressive disclosure panel",
        url: "https://21st.dev/pattern/progressive-disclosure-panel",
        description: `Comparable pattern for "${seed}": defers secondary detail behind an expand affordance.`,
      },
      {
        source: "21st.dev" as const,
        name: "Split hero with contextual nav",
        url: "https://21st.dev/pattern/split-hero-contextual-nav",
        description: `Comparable pattern for "${seed}": reframes the entry point around the dominant task.`,
      },
    ];

    return { references: catalogue.slice(0, limit) };
  }
}
