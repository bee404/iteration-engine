import type { PatternReference } from "@/lib/types";

export interface PatternQuery {
  /** Free-text description of the layout/pattern being sought, derived from the critique + goal. */
  query: string;
  designGoal?: string;
  limit?: number;
}

export interface PatternQueryResult {
  references: PatternReference[];
}

/**
 * A source of comparable layout/pattern references used to ground directions in a
 * known solution rather than inventing from scratch. The real implementation queries
 * 21st.dev's MCP server (https://21st.dev/api/mcp) live, per-round, under Bryan's own
 * API key — no local mirror of their taxonomy is kept, per their Terms of Service.
 */
export interface PatternProvider {
  readonly name: string;
  findPatterns(query: PatternQuery): Promise<PatternQueryResult>;
}
