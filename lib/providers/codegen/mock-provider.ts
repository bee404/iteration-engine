import type { CodeGenProvider, CodeGenRequest } from "./types";

/**
 * Typed mock standing in for the real Claude Sonnet / GPT-4o code-generation call.
 * Yields a small, syntactically valid React component token-by-token (word chunks)
 * so the SSE streaming plumbing — endpoint, transport, and preview iframe — is
 * provable end to end before a real model call is wired in.
 */
export class MockCodeGenProvider implements CodeGenProvider {
  readonly name = "mock-codegen";
  readonly provenance = { provider: "mock", model: null };
  readonly language = "tsx";

  async *streamCode(request: CodeGenRequest): AsyncGenerator<string, void, unknown> {
    const { direction, designGoal } = request;

    const source = `// Generated prototype for direction: ${direction.title}
// Goal: ${designGoal}
export default function GeneratedPreview() {
  return (
    <main style={{ fontFamily: "sans-serif", padding: 24 }}>
      <h1>${direction.title}</h1>
      <p>${direction.rationale}</p>
      <ul>
${direction.suggestedChanges.map((change) => `        <li>${change}</li>`).join("\n")}
      </ul>
      <button type="button">Primary action</button>
    </main>
  );
}
`;

    // Chunk on whitespace boundaries so the client sees incremental, readable tokens
    // rather than a single flush — this is the behavior a real streaming model call
    // would exhibit.
    const tokens = source.match(/\S+\s*/g) ?? [source];
    for (const token of tokens) {
      await new Promise((resolve) => setTimeout(resolve, 15));
      yield token;
    }
  }
}
