import { NextResponse } from "next/server";
import { getLLMProvider } from "@/lib/providers/llm";
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
}
