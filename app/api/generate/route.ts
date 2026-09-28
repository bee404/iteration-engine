import { CodeGenGenerationError, getCodeGenProvider } from "@/lib/providers/codegen";
import { postProcessGeneratedCode } from "@/lib/providers/codegen/postprocess";
import { resolveDesignSystemForRequest } from "@/lib/providers/codegen/shared";
import type { CodeGenRequest } from "@/lib/providers/codegen/types";
import type { Critique, Direction, GenerationMode, ImageDimensions } from "@/lib/types";
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

function isCritique(value: unknown): value is Critique {
  if (!value || typeof value !== "object") return false;
  const critique = value as Critique;
  const hasItems = (items: unknown): boolean =>
    Array.isArray(items) &&
    items.every(
      (item) =>
        !!item &&
        typeof item === "object" &&
        typeof (item as { text?: unknown }).text === "string",
    );
  return (
    typeof critique.summary === "string" &&
    hasItems(critique.signal) &&
    hasItems(critique.preference) &&
    Array.isArray(critique.flaggedAmbiguities) &&
    critique.flaggedAmbiguities.every((item) => typeof item === "string") &&
    typeof critique.model === "string"
  );
}

function isViewport(value: unknown): value is ImageDimensions | null {
  if (value === null) return true;
  if (!value || typeof value !== "object") return false;
  const viewport = value as ImageDimensions;
  return (
    Number.isInteger(viewport.width) &&
    viewport.width > 0 &&
    Number.isInteger(viewport.height) &&
    viewport.height > 0
  );
}

const GENERATION_MODES = new Set<GenerationMode>([
  "preserve-source",
  "apply-design-system",
  "redesign",
]);

function isGenerationMode(value: unknown): value is GenerationMode {
  return typeof value === "string" && GENERATION_MODES.has(value as GenerationMode);
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
  if (typeof body.feedbackText !== "string" || !body.feedbackText.trim()) {
    return new Response(JSON.stringify({ error: "feedbackText is required" }), { status: 400 });
  }
  if (!isCritique(body.critique)) {
    return new Response(JSON.stringify({ error: "critique is required" }), { status: 400 });
  }
  if (!isViewport(body.viewport)) {
    return new Response(JSON.stringify({ error: "viewport must be a positive width/height pair or null" }), {
      status: 400,
    });
  }

  const generationMode = body.generationMode ?? "preserve-source";
  if (!isGenerationMode(generationMode)) {
    return new Response(JSON.stringify({ error: "generationMode is invalid" }), { status: 400 });
  }
  if (body.reviewerContext !== undefined && typeof body.reviewerContext !== "string") {
    return new Response(JSON.stringify({ error: "reviewerContext must be a string" }), { status: 400 });
  }
  if (body.constraints !== undefined && typeof body.constraints !== "string") {
    return new Response(JSON.stringify({ error: "constraints must be a string" }), { status: 400 });
  }
  if (body.designSystemId !== undefined && typeof body.designSystemId !== "string") {
    return new Response(JSON.stringify({ error: "designSystemId must be a string" }), { status: 400 });
  }

  const codeGenRequest: CodeGenRequest = {
    direction: body.direction,
    designGoal: body.designGoal,
    feedbackText: body.feedbackText,
    reviewerContext: body.reviewerContext?.trim() || undefined,
    constraints: body.constraints?.trim() || undefined,
    critique: body.critique,
    viewport: body.viewport,
    generationMode,
    designSystemId: body.designSystemId?.trim() || undefined,
    screenshotRef: body.screenshotRef,
  };
  const designSystem = resolveDesignSystemForRequest(codeGenRequest);
  if (
    (generationMode === "apply-design-system" || codeGenRequest.designSystemId) &&
    !designSystem
  ) {
    return new Response(JSON.stringify({ error: "A recognized designSystemId is required for this mode" }), {
      status: 400,
    });
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
        for await (const token of provider.streamCode(codeGenRequest)) {
          raw += token;
          controller.enqueue(encoder.encode(sseEvent("token", { token })));
        }

        // Deterministic cleanup strips markdown fences and surfaces issues such as emoji icons.
        // Palette/font enforcement only runs when the user explicitly selected a design system;
        // source-preserving generation leaves the reference's visual language untouched.
        const { code, warnings } = postProcessGeneratedCode(raw, { designSystem });
        controller.enqueue(encoder.encode(sseEvent("code", { code, warnings, provenance: provider.provenance })));
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
