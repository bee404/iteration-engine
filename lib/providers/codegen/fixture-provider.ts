import { findCapturedDirection } from "@/lib/fixtures/examples";
import { CodeGenGenerationError } from "./errors";
import type { CodeGenProvider, CodeGenRequest } from "./types";

/**
 * Fixture-backed code-gen provider for DEMO_MODE. Streams the active fixture's VERBATIM real
 * captured code for the requested direction, token-by-token, so the SSE transport, bottom
 * sheet, and preview render exactly as they do against a live model — zero external API calls.
 *
 * If a direction has no captured code yet (capturedCode: null, or an unknown direction id), it
 * throws a typed CodeGenGenerationError, which app/api/generate/route.ts turns into the same
 * SSE "error" event a real failure would — so demo mode also faithfully exercises the shipped
 * code-gen error state instead of fabricating output. Drop a real capture into the fixture to
 * light that direction up.
 *
 * Selected only via the DEMO_MODE branch in ./index.ts; it never sits on the live path.
 */
export class FixtureCodeGenProvider implements CodeGenProvider {
  readonly name = "fixture-codegen";
  readonly language = "tsx";

  async *streamCode(request: CodeGenRequest): AsyncGenerator<string, void, unknown> {
    const captured = findCapturedDirection(request.direction.id);

    if (!captured || captured.capturedCode === null) {
      throw new CodeGenGenerationError(
        "unparseable_response",
        `No captured code sample for "${request.direction.title}" in demo mode yet — replaying only real captures.`,
      );
    }

    // Chunk on whitespace boundaries and pace the yield so the client sees the same
    // incremental, readable streaming a real model call produces — identical to the mock's
    // cadence so the streaming feel is unchanged.
    const tokens = captured.capturedCode.match(/\S+\s*/g) ?? [captured.capturedCode];
    for (const token of tokens) {
      await new Promise((resolve) => setTimeout(resolve, 12));
      yield token;
    }
  }
}

