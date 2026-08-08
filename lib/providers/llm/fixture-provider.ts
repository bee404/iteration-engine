import { getActiveFixture } from "@/lib/fixtures/examples";
import type {
  CritiqueRequest,
  CritiqueResult,
  DirectionsRequest,
  DirectionsResult,
  LLMProvider,
} from "./types";

/**
 * Fixture-backed LLM provider for DEMO_MODE. Replays the active captured fixture's REAL
 * critique and directions (see lib/fixtures/examples.ts) instead of calling Claude — zero
 * external API calls. The request inputs are intentionally ignored: demo mode replays a
 * fixed captured round so the whole flow is walkable on canned data regardless of what a
 * reviewer types into the form.
 *
 * Selected only via the DEMO_MODE branch in ./index.ts; it never sits on the live path.
 */
export class FixtureLLMProvider implements LLMProvider {
  readonly name = "fixture-llm";

  async generateCritique(_request: CritiqueRequest): Promise<CritiqueResult> {
    return { critique: getActiveFixture().critique };
  }

  async generateDirections(_request: DirectionsRequest): Promise<DirectionsResult> {
    return { directions: getActiveFixture().directions.map((d) => d.direction) };
  }
}

