import assert from "node:assert/strict";
import { test } from "node:test";
import { PatternQueryError } from "./errors";
import { TwentyFirstProvider } from "./twentyfirst-provider";

/** A real 21st.dev MCP `tools/call` response for `search`, captured verbatim against the
 * live endpoint (https://21st.dev/api/mcp, 2026-08-23, query: "pricing table with annual
 * monthly toggle") so this fixture is grounded in what the server actually returns rather
 * than a hand-written approximation of the MCP spec. */
function liveSearchResponse(): Response {
  const body = {
    jsonrpc: "2.0",
    id: "test-id",
    result: {
      content: [{ type: "text", text: "3 result(s) across 21st.dev (metadata only)." }],
      structuredContent: {
        results: [
          {
            type: "component",
            id: 18957,
            name: "Pricing Section with Frequency Toggle",
            description:
              "Interactive three-tier pricing section with a monthly/yearly toggle, animated price numbers, and a highlighted popular plan.",
            previewUrl: "https://cdn.21st.dev/sshahaider/pricing-4/default/preview.png",
            author: "sshahaider",
            installCommand: 'npx shadcn@latest add "https://21st.dev/r/sshahaider/pricing-4?api_key=$API_KEY_21ST"',
            url: "https://21st.dev/@sshahaider/components/pricing-4",
          },
          {
            type: "component",
            id: 1541,
            name: "Pricing Table",
            description: "A feature comparison pricing table component with animated pricing and interval switching.",
            previewUrl: "https://cdn.21st.dev/kokonutd/pricing-table/default/preview.png",
            author: "kokonutd",
            installCommand: 'npx shadcn@latest add "https://21st.dev/r/kokonutd/pricing-table?api_key=$API_KEY_21ST"',
            url: "https://21st.dev/@kokonutd/components/pricing-table",
          },
        ],
      },
    },
  };
  return new Response(JSON.stringify(body), { status: 200, headers: { "content-type": "application/json" } });
}

function withMockedFetch(handler: () => Response | Promise<Response>, run: () => Promise<void>): Promise<void> {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = (async () => handler()) as typeof fetch;
  return run().finally(() => {
    globalThis.fetch = originalFetch;
  });
}

test("findPatterns maps a live-shaped MCP search response onto PatternReference[]", async () => {
  await withMockedFetch(liveSearchResponse, async () => {
    const provider = new TwentyFirstProvider("test-key");
    const { references } = await provider.findPatterns({ query: "pricing table", limit: 2 });

    assert.equal(references.length, 2);
    assert.deepEqual(references[0], {
      source: "21st.dev",
      name: "Pricing Section with Frequency Toggle",
      url: "https://21st.dev/@sshahaider/components/pricing-4",
      description:
        "Interactive three-tier pricing section with a monthly/yearly toggle, animated price numbers, and a highlighted popular plan.",
    });
  });
});

test("findPatterns respects the requested limit even when the server returns more results", async () => {
  await withMockedFetch(liveSearchResponse, async () => {
    const provider = new TwentyFirstProvider("test-key");
    const { references } = await provider.findPatterns({ query: "pricing table", limit: 1 });
    assert.equal(references.length, 1);
  });
});

test("findPatterns throws a typed model_error after exhausting retries on a JSON-RPC error envelope", async () => {
  // Shape confirmed live: an invalid API key returns HTTP 401 with a top-level JSON-RPC
  // `error` (no `result`), matching 21st.dev's documented auth-failure response.
  let callCount = 0;
  await withMockedFetch(
    () => {
      callCount++;
      return new Response(
        JSON.stringify({
          jsonrpc: "2.0",
          id: null,
          error: { code: -32001, message: "Not authenticated - your API key is missing or was reset." },
        }),
        { status: 401 }
      );
    },
    async () => {
      const provider = new TwentyFirstProvider("bad-key");
      await assert.rejects(
        () => provider.findPatterns({ query: "pricing table" }),
        (error: unknown) => error instanceof PatternQueryError && error.code === "model_error"
      );
    }
  );
  assert.equal(callCount, 2, "expected exactly one retry (MAX_ATTEMPTS = 2)");
});

test("findPatterns throws a typed unparseable_response error when structuredContent.results is missing", async () => {
  await withMockedFetch(
    () =>
      new Response(JSON.stringify({ jsonrpc: "2.0", id: "1", result: { content: [] } }), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    async () => {
      const provider = new TwentyFirstProvider("test-key");
      await assert.rejects(
        () => provider.findPatterns({ query: "pricing table" }),
        (error: unknown) => error instanceof PatternQueryError && error.code === "unparseable_response"
      );
    }
  );
});

test("findPatterns trims whitespace from name the same way it trims description", async () => {
  // Regression for a double-space render bug ("Grounded in:  Dashboard") caused by an
  // untrimmed `name` from the MCP response while `description` was already trimmed.
  await withMockedFetch(
    () =>
      new Response(
        JSON.stringify({
          jsonrpc: "2.0",
          id: "1",
          result: {
            content: [],
            structuredContent: {
              results: [
                {
                  type: "component",
                  name: " Dashboard ",
                  description: " a dashboard layout ",
                  url: "https://21st.dev/@author/components/dashboard",
                },
              ],
            },
          },
        }),
        { status: 200, headers: { "content-type": "application/json" } }
      ),
    async () => {
      const provider = new TwentyFirstProvider("test-key");
      const { references } = await provider.findPatterns({ query: "dashboard" });
      assert.equal(references[0]?.name, "Dashboard");
      assert.equal(references[0]?.description, "a dashboard layout");
    }
  );
});

test("findPatterns drops results missing a name, url, or description rather than fabricating one", async () => {
  await withMockedFetch(
    () =>
      new Response(
        JSON.stringify({
          jsonrpc: "2.0",
          id: "1",
          result: {
            content: [],
            structuredContent: {
              results: [
                { type: "component", name: "Missing URL", description: "no url field" },
                {
                  type: "component",
                  name: "Complete",
                  description: "has everything",
                  url: "https://21st.dev/@author/components/slug",
                },
              ],
            },
          },
        }),
        { status: 200, headers: { "content-type": "application/json" } }
      ),
    async () => {
      const provider = new TwentyFirstProvider("test-key");
      const { references } = await provider.findPatterns({ query: "anything" });
      assert.equal(references.length, 1);
      assert.equal(references[0]?.name, "Complete");
    }
  );
});
