import { NextResponse } from "next/server";
import { CritiqueGenerationError, getLLMProvider } from "@/lib/providers/llm";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);

  if (!body || typeof body.screenshotRef !== "string" || !body.screenshotRef) {
    return NextResponse.json({ error: "screenshotRef is required" }, { status: 400 });
  }
  if (typeof body.designGoal !== "string" || !body.designGoal.trim()) {
    return NextResponse.json({ error: "designGoal is required" }, { status: 400 });
  }
  if (typeof body.feedbackText !== "string" || !body.feedbackText.trim()) {
    return NextResponse.json({ error: "feedbackText is required" }, { status: 400 });
  }

  const provider = getLLMProvider();

  try {
    const result = await provider.generateCritique({
      screenshotRef: body.screenshotRef,
      designGoal: body.designGoal,
      feedbackText: body.feedbackText,
      reviewerContext: typeof body.reviewerContext === "string" ? body.reviewerContext : undefined,
      constraints: typeof body.constraints === "string" ? body.constraints : undefined,
    });

    return NextResponse.json(result);
  } catch (error) {
    // Known, typed failure modes (bad screenshot ref, upstream API error, unparseable
    // model response after retry) get a clear JSON error instead of an unhandled 500.
    // Anything else is a genuine bug and should still surface, not be swallowed here.
    if (error instanceof CritiqueGenerationError) {
      const status = error.code === "invalid_screenshot" ? 400 : 502;
      return NextResponse.json({ error: error.message, code: error.code }, { status });
    }
    throw error;
  }
}
