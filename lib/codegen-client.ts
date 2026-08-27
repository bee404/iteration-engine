import type { Direction, GenerationProvenance } from "@/lib/types";
import { useRoundStore } from "@/lib/stores/round";

interface GeneratePrototypeRequest {
  direction: Direction;
  designGoal: string;
  screenshotRef: string;
}

interface StreamEvent {
  event: string;
  data: unknown;
}

function parseStreamEvent(frame: string): StreamEvent | null {
  const eventLine = frame.split("\n").find((line) => line.startsWith("event: "));
  const dataLine = frame.split("\n").find((line) => line.startsWith("data: "));
  if (!eventLine || !dataLine) return null;

  return {
    event: eventLine.slice("event: ".length),
    data: JSON.parse(dataLine.slice("data: ".length)),
  };
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : {};
}

function asGenerationProvenance(value: unknown): GenerationProvenance | null {
  const provenance = asRecord(value);
  if (typeof provenance.provider !== "string" || !provenance.provider) return null;
  if (provenance.model !== null && typeof provenance.model !== "string") return null;
  return { provider: provenance.provider, model: provenance.model as string | null };
}

/** Streams one selected direction into the canonical in-memory round store. */
export async function generatePrototype(request: GeneratePrototypeRequest): Promise<void> {
  const { direction, designGoal, screenshotRef } = request;
  const actions = useRoundStore.getState();
  actions.startPrototype(direction.id, "tsx");

  try {
    const response = await fetch("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
      body: JSON.stringify({ direction, designGoal, screenshotRef }),
    });

    if (!response.ok || !response.body) {
      throw new Error(`Generation request failed (${response.status})`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let receivedFinalCode = false;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      const frames = buffer.split("\n\n");
      buffer = frames.pop() ?? "";

      for (const frame of frames) {
        const parsed = parseStreamEvent(frame);
        if (!parsed) continue;
        const data = asRecord(parsed.data);

        if (parsed.event === "token" && typeof data.token === "string") {
          useRoundStore.getState().appendPrototypeToken(direction.id, data.token);
        }
        if (parsed.event === "code" && typeof data.code === "string") {
          const provenance = asGenerationProvenance(data.provenance);
          if (!provenance) throw new Error("Generation completed without provider provenance");
          const warnings = Array.isArray(data.warnings)
            ? data.warnings
                .map((warning) => asRecord(warning).message)
                .filter((message): message is string => typeof message === "string")
            : [];
          useRoundStore.getState().finalizePrototype(direction.id, data.code, warnings, provenance);
          receivedFinalCode = true;
        }
        if (parsed.event === "error") {
          throw new Error(typeof data.message === "string" ? data.message : "Generation failed");
        }
      }
    }

    if (!receivedFinalCode) throw new Error("Generation ended without a complete component");
    useRoundStore.getState().completePrototype(direction.id);
  } catch (error) {
    useRoundStore
      .getState()
      .failPrototype(direction.id, error instanceof Error ? error.message : "Generation failed");
  }
}
