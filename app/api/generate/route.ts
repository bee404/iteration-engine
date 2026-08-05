import { getCodeGenProvider } from "@/lib/providers/codegen";
import type { Direction } from "@/lib/types";

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
 * see components/direction-card.tsx.
 */
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);

  if (!body || !isDirection(body.direction)) {
    return new Response(JSON.stringify({ error: "direction is required" }), { status: 400 });
  }
  if (typeof body.designGoal !== "string" || !body.designGoal.trim()) {
    return new Response(JSON.stringify({ error: "designGoal is required" }), { status: 400 });
  }

  const provider = getCodeGenProvider();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const encoder = new TextEncoder();
      try {
        controller.enqueue(encoder.encode(sseEvent("start", { language: provider.language })));

        for await (const token of provider.streamCode({ direction: body.direction, designGoal: body.designGoal })) {
          controller.enqueue(encoder.encode(sseEvent("token", { token })));
        }

        controller.enqueue(encoder.encode(sseEvent("done", { language: provider.language })));
      } catch (error) {
        controller.enqueue(
          encoder.encode(sseEvent("error", { message: error instanceof Error ? error.message : "Generation failed" })),
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
