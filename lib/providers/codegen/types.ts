import type { Direction } from "@/lib/types";

export interface CodeGenRequest {
  direction: Direction;
  designGoal: string;
}

/**
 * A source of on-demand code/prototype generation for a chosen direction. The real
 * implementation calls Claude Sonnet (primary) / GPT-4o (fallback) and streams the
 * response token-by-token as it arrives. Callers consume `streamCode` as an async
 * generator regardless of which concrete provider is behind it.
 */
export interface CodeGenProvider {
  readonly name: string;
  language: string;
  streamCode(request: CodeGenRequest): AsyncGenerator<string, void, unknown>;
}
