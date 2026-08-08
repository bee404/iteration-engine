import { NextResponse } from "next/server";
import { CRITIQUE_ERROR_STATUS, CritiqueGenerationError, getLLMProvider } from "@/lib/providers/llm";

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

  // Provider selection (getLLMProvider) and generation both live inside this try: provider
  // selection can throw too (e.g. LLM_PROVIDER=claude set without ANTHROPIC_API_KEY), and if
  // that call sat outside the try it would be a genuinely unhandled exception — Vercel turns
  // that into a bare 502 with no JSON body, indistinguishable from a platform crash. Every
  // failure mode below, known or not, must come back as the same typed { error, code } shape.
  try {
    const provider = getLLMProvider();
    const result = await provider.generateCritique({
      screenshotRef: body.screenshotRef,
      designGoal: body.designGoal,
      feedbackText: body.feedbackText,
      reviewerContext: typeof body.reviewerContext === "string" ? body.reviewerContext : undefined,
      constraints: typeof body.constraints === "string" ? body.constraints : undefined,
    });

    return NextResponse.json(result);
  } catch (error) {
    // Known, typed failure modes (bad screenshot ref, upstream API error, unparseable model
    // response after retry) already carry a CritiqueGenerationError code. Anything else —
    // provider misconfiguration, a future bug, whatever — still gets wrapped as "internal_error"
    // rather than rethrown: a route handler that lets an exception escape uncaught is the exact
    // bug we're fixing here, so "unanticipated" must still produce a typed response, not a crash.
    const critiqueError =
      error instanceof CritiqueGenerationError
        ? error
        : new CritiqueGenerationError("internal_error", error instanceof Error ? error.message : String(error));
    console.error("[api/critique] critique generation failed:", critiqueError);
    return NextResponse.json(
      { error: critiqueError.message, code: critiqueError.code },
      { status: CRITIQUE_ERROR_STATUS[critiqueError.code] }
    );
  }
}
