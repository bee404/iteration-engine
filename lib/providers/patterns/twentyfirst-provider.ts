import { randomUUID } from "node:crypto";
import type { PatternReference } from "@/lib/types";
import { PatternQueryError } from "./errors";
import type { PatternProvider, PatternQuery, PatternQueryResult } from "./types";

const MCP_ENDPOINT = "https://21st.dev/api/mcp";
/** One retry on a failed or unparseable response, mirroring the house style set by
 * lib/providers/llm/claude-provider.ts (MAX_ATTEMPTS = 2) rather than retrying indefinitely. */
const MAX_ATTEMPTS = 2;
/** Matches MockPatternProvider's default so switching providers doesn't change round shape. */
const DEFAULT_LIMIT = 3;

/**
 * One row of `result.structuredContent.results` from the 21st.dev MCP `search` tool call,
 * confirmed against the live endpoint (2026-08-23). Only the fields this provider actually
 * uses are declared; the tool also returns previewUrl/videoUrl/authorImage/installCommand/id,
 * which PatternReference has no use for.
 */
interface McpSearchResultItem {
  type?: string;
  name?: string;
  description?: string;
  url?: string;
}

interface McpToolCallResult {
  content?: Array<{ type: string; text?: string }>;
  structuredContent?: { results?: McpSearchResultItem[] };
  /** Tool-level failure per the MCP spec: transport succeeded (HTTP 200, valid JSON-RPC
   * envelope) but the tool itself reports an error in its result rather than throwing one at
   * the JSON-RPC layer. Distinct from `error` on McpJsonRpcResponse below. */
  isError?: boolean;
}

interface McpJsonRpcResponse {
  jsonrpc: "2.0";
  id: string | number | null;
  result?: McpToolCallResult;
  error?: { code: number; message: string };
}

/**
 * Real pattern provider grounding directions in 21st.dev's live catalog (docs/decisions.md,
 * Decision 5). Calls the `search` tool on 21st.dev's MCP server (https://21st.dev/api/mcp)
 * live, per round, under Bryan's own API key — no local mirror of their taxonomy is kept,
 * per their Terms of Service (last checked 2026-07-20, which prohibits scraping, bulk
 * collection, AI-training use, and redistribution of structured metadata/media).
 *
 * `search` is free and unmetered (confirmed against the live endpoint); this provider
 * deliberately never calls the metered `get_component` tool (capped at 2/day on 21st.dev's
 * free tier), since PatternReference only needs the metadata `search` already returns
 * (name, url, description) — not the component's literal source code.
 *
 * Talks to the MCP endpoint directly via fetch/JSON-RPC rather than an MCP SDK dependency,
 * mirroring how ClaudeLLMProvider calls the Anthropic REST API directly
 * (lib/providers/llm/claude-provider.ts): one retry on failure, then a typed
 * PatternQueryError. No caller needs to change — this implements the same PatternProvider
 * interface as MockPatternProvider.
 */
export class TwentyFirstProvider implements PatternProvider {
  readonly name = "twentyfirst-dev";

  private readonly apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async findPatterns(query: PatternQuery): Promise<PatternQueryResult> {
    let lastError: unknown;
    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      try {
        const references = await this.search(query);
        return { references };
      } catch (error) {
        lastError = error;
      }
    }
    if (lastError instanceof PatternQueryError) throw lastError;
    throw new PatternQueryError(
      "model_error",
      `21st.dev MCP search failed after ${MAX_ATTEMPTS} attempts: ${
        lastError instanceof Error ? lastError.message : String(lastError)
      }`
    );
  }

  private async search(query: PatternQuery): Promise<PatternReference[]> {
    // Free-text description of the layout being sought, derived by the caller from the
    // critique + design goal (see PatternQuery jsdoc). Mirrors MockPatternProvider's seed
    // fallback so both providers behave the same when the caller passes an empty query.
    const seed = query.query || query.designGoal || "layout";
    const limit = query.limit ?? DEFAULT_LIMIT;

    const response = await fetch(MCP_ENDPOINT, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        // Required by the MCP Streamable HTTP transport even when the server responds with a
        // single JSON body (as 21st.dev's does) rather than an SSE stream.
        accept: "application/json, text/event-stream",
        "x-api-key": this.apiKey,
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: randomUUID(),
        method: "tools/call",
        params: {
          name: "search",
          // Scoped to components (not themes/templates): Decision 5 grounds directions in
          // "existing layout/component patterns", not color themes or full page templates.
          arguments: { query: seed, type: "component", limit },
        },
      }),
    });

    if (!response.ok) {
      const body = await response.text().catch(() => "");
      throw new PatternQueryError(
        "model_error",
        `21st.dev MCP returned ${response.status} ${response.statusText}: ${body.slice(0, 500)}`
      );
    }

    const payload = (await response.json()) as McpJsonRpcResponse;

    if (payload.error) {
      throw new PatternQueryError(
        "model_error",
        `21st.dev MCP error ${payload.error.code}: ${payload.error.message}`
      );
    }
    if (!payload.result) {
      throw new PatternQueryError("unparseable_response", '21st.dev MCP response is missing a "result".');
    }
    if (payload.result.isError) {
      const text = payload.result.content?.find((block) => block.type === "text")?.text ?? "unknown tool error";
      throw new PatternQueryError("model_error", `21st.dev search tool reported an error: ${text}`);
    }

    const results = payload.result.structuredContent?.results;
    if (!Array.isArray(results)) {
      throw new PatternQueryError(
        "unparseable_response",
        '21st.dev MCP search response is missing "structuredContent.results".'
      );
    }

    // Only keep results with everything a reviewer needs to click through to a real,
    // resolving component page — a result missing any of these isn't a usable reference.
    return results
      .filter((item) => item.type === undefined || item.type === "component")
      .filter(
        (item): item is McpSearchResultItem & { name: string; url: string; description: string } =>
          typeof item.name === "string" &&
          item.name.trim().length > 0 &&
          typeof item.url === "string" &&
          item.url.trim().length > 0 &&
          typeof item.description === "string" &&
          item.description.trim().length > 0
      )
      .slice(0, limit)
      .map((item) => ({
        source: "21st.dev" as const,
        name: item.name.trim(),
        url: item.url,
        description: item.description.trim(),
      }));
  }
}
