import { CodeGenGenerationError, getCodeGenProvider } from "@/lib/providers/codegen";
import { postProcessGeneratedCode } from "@/lib/providers/codegen/postprocess";
import type { Direction } from "@/lib/types";
import { authorizeRequest } from "@/lib/security/access";
import { enforceRateLimit, MODEL_RATE_LIMITS } from "@/lib/security/rate-limit";

function isDirection(value: unknown): value is Direction {
  return (
    !!value &&
    typeof value === "object" &&
    typeof (value as Direction).id === "string" &&
    typeof (value as Direction).title === "string" &&
    Array.isArray((value as Direction).suggestedChanges)
  );
}

function sseEvent(event: string, data: unknown): string {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

/**
 * Streams generated code for a single direction as Server-Sent Events. Consumed by
 * the client via fetch + ReadableStream (not EventSource, since this is a POST) —
 * see lib/codegen-client.ts.
 */
export async function POST(request: Request) {
  const denied = authorizeRequest(request);
  if (denied) return denied;
  const limited = enforceRateLimit(request, MODEL_RATE_LIMITS.generate);
  if (limited) return limited;

  const body = await request.json().catch(() => null);

  if (!body || !isDirection(body.direction)) {
    return new Response(JSON.stringify({ error: "direction is required" }), { status: 400 });
  }
  if (typeof body.designGoal !== "string" || !body.designGoal.trim()) {
    return new Response(JSON.stringify({ error: "designGoal is required" }), { status: 400 });
  }
  if (typeof body.screenshotRef !== "string" || !body.screenshotRef.trim()) {
    return new Response(JSON.stringify({ error: "screenshotRef is required" }), { status: 400 });
  }

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const encoder = new TextEncoder();
      // Provider selection and generation both live inside this try: provider selection can
      // throw too (e.g. CODEGEN_PROVIDER=claude set without ANTHROPIC_API_KEY), and once the
      // stream has started there is no HTTP status left to signal failure with — an SSE
      // "error" event is the only way back to the client, so every failure mode, known or
      // not, must be normalized into one instead of left to crash the stream uncaught.
      try {
        const provider = getCodeGenProvider();
        controller.enqueue(encoder.encode(sseEvent("start", { language: provider.language })));

        // Stream raw tokens for the live preview, but accumulate them so the deterministic
        // post-processing stage can run over the complete output. Per-token transforms are
        // unsafe (a code fence or off-palette hex can straddle two tokens), so cleanup runs
        // once at the end.
        let raw = "";
        for await (const token of provider.streamCode({
          direction: body.direction,
          designGoal: body.designGoal,
          screenshotRef: body.screenshotRef,
        })) {
          raw += token;
          controller.enqueue(encoder.encode(sseEvent("token", { token })));
        }

        // Deterministic guarantees that must not depend on model compliance: strip markdown
        // fences, rewrite off-palette colors, inject the self-hosted font. The "code" event
        // carries the authoritative post-processed source the client replaces the streamed
        // buffer with; "warnings" surfaces issues the model must fix (e.g. emoji icons).
        const { code, warnings } = postProcessGeneratedCode(raw);
        controller.enqueue(encoder.encode(sseEvent("code", { code, warnings })));
        controller.enqueue(encoder.encode(sseEvent("done", { language: provider.language })));
      } catch (error) {
        const codeGenError =
          error instanceof CodeGenGenerationError
            ? error
            : new CodeGenGenerationError("internal_error", error instanceof Error ? error.message : String(error));
        console.error("[api/generate] code generation failed:", codeGenError);
        controller.enqueue(
          encoder.encode(sseEvent("error", { message: codeGenError.message, code: codeGenError.code })),
        );
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
