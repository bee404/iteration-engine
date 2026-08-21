import { NextResponse } from "next/server";
import { DIRECTIONS_ERROR_STATUS, DirectionsGenerationError, getLLMProvider } from "@/lib/providers/llm";
import { getPatternProvider } from "@/lib/providers/patterns";
import type { Critique } from "@/lib/types";

function isCritique(value: unknown): value is Critique {
  return (
    !!value &&
    typeof value === "object" &&
    typeof (value as Critique).summary === "string" &&
    Array.isArray((value as Critique).signal) &&
    Array.isArray((value as Critique).preference)
  );
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);

  if (!body || !isCritique(body.critique)) {
    return NextResponse.json({ error: "critique is required" }, { status: 400 });
  }
  if (typeof body.designGoal !== "string" || !body.designGoal.trim()) {
    return NextResponse.json({ error: "designGoal is required" }, { status: 400 });
  }
  if (typeof body.feedbackText !== "string" || !body.feedbackText.trim()) {
    return NextResponse.json({ error: "feedbackText is required" }, { status: 400 });
  }

  // Provider selection and generation both live inside this try, mirroring /api/critique:
  // getLLMProvider can throw on misconfiguration, and the real Claude directions call has
  // typed failure modes (upstream API error, unparseable/duplicate response after retry).
  // Every failure must come back as the same typed { error, code } shape rather than an
  // unhandled exception that Vercel turns into a bare 502 with no diagnosable body.
  try {
    const patternProvider = getPatternProvider();
    const { references } = await patternProvider.findPatterns({
      query: body.critique.summary,
      designGoal: body.designGoal,
      limit: 3,
    });

    const llmProvider = getLLMProvider();
    const result = await llmProvider.generateDirections({
      critique: body.critique,
      designGoal: body.designGoal,
      feedbackText: body.feedbackText,
      constraints: typeof body.constraints === "string" ? body.constraints : undefined,
      patternReferences: references,
    });

    return NextResponse.json(result);
  } catch (error) {
    const directionsError =
      error instanceof DirectionsGenerationError
        ? error
        : new DirectionsGenerationError("internal_error", error instanceof Error ? error.message : String(error));
    console.error("[api/directions] directions generation failed:", directionsError);
    return NextResponse.json(
      { error: directionsError.message, code: directionsError.code },
      { status: DIRECTIONS_ERROR_STATUS[directionsError.code] }
    );
  }
}
