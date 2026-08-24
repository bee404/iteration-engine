import type { ImageDimensions } from "@/lib/types";

/**
 * The viewport box is the interface rectangle a round is measured in (Decision 14): Coquí infers
 * it from the first screenshot, Bryan may correct it, and once the chain's first iteration is
 * committed it is locked and every later round in that chain reuses it.
 */

/** A 3× capture of an 8K display is still under 16k pixels, so anything past this is a typo. */
export const MAX_VIEWPORT_EDGE = 20000;

/** Raw text held by the two correction inputs, before it is known to be a box. */
export interface ViewportBoxDraft {
  width: string;
  height: string;
}

export type ViewportBoxParse =
  | { status: "valid"; box: ImageDimensions }
  | { status: "invalid"; message: string };

const EDGE_CONSTRAINT = `Width and height must be whole numbers between 1 and ${MAX_VIEWPORT_EDGE}.`;

function parseEdge(value: string): number | null {
  const trimmed = value.trim();
  if (!/^\d+$/.test(trimmed)) return null;
  const edge = Number(trimmed);
  if (edge < 1 || edge > MAX_VIEWPORT_EDGE) return null;
  return edge;
}

/** Validates a correction before it is allowed to replace the inferred measurement. */
export function parseViewportBox(draft: ViewportBoxDraft): ViewportBoxParse {
  const width = parseEdge(draft.width);
  const height = parseEdge(draft.height);
  if (width === null || height === null) return { status: "invalid", message: EDGE_CONSTRAINT };
  return { status: "valid", box: { width, height } };
}

export function toViewportBoxDraft(box: ImageDimensions | null): ViewportBoxDraft {
  if (!box) return { width: "", height: "" };
  return { width: String(box.width), height: String(box.height) };
}

export function formatViewportBox(box: ImageDimensions): string {
  return `${box.width} × ${box.height}`;
}

