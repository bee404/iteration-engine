import { twentyFirstComponentUrl } from "./component-url";
import type { PatternProvider, PatternQuery, PatternQueryResult } from "./types";

/**
 * Real 21st.dev components the mock grounds directions in. Each `author`/`slug` pair is a
 * live, verified component page, so the URL built from it resolves instead of 404ing.
 * When a live TwentyFirstProvider replaces this, it will receive the same author/slug from
 * the MCP `search` results and build the URL the same way.
 */
const MOCK_COMPONENTS = [
  {
    name: "Hero section",
    author: "prebuiltui",
    slug: "hero-section",
    note: "reframes the entry point around one dominant action and message.",
  },
  {
    name: "Feature sections",
    author: "prebuiltui",
    slug: "feature-sections",
    note: "organizes supporting detail into a scannable, weighted grid.",
  },
  {
    name: "Bento grid",
    author: "designali-in",
    slug: "bento-grid",
    note: "packs related tiles into a modular layout with clear focal points.",
  },
] as const;

/**
 * Typed mock standing in for the live 21st.dev MCP query. TWENTYFIRST_API_KEY is not
 * configured yet, so this returns a fixed set of references to real, resolving components.
 * Replace with a TwentyFirstProvider that calls https://21st.dev/api/mcp at generation time
 * once the key is available — no caller needs to change, since both implement
 * PatternProvider.
 */
export class MockPatternProvider implements PatternProvider {
  readonly name = "mock-21st-dev";

  async findPatterns(query: PatternQuery): Promise<PatternQueryResult> {
    const seed = query.query || query.designGoal || "layout";
    const limit = query.limit ?? 3;

    const references = MOCK_COMPONENTS.map((component) => ({
      source: "21st.dev" as const,
      name: component.name,
      url: twentyFirstComponentUrl(component.author, component.slug),
      description: `Comparable pattern for "${seed}": ${component.note}`,
    }));

    return { references: references.slice(0, limit) };
  }
}
