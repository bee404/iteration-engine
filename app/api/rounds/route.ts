import { NextResponse } from "next/server";
import { createRound, listRounds } from "@/lib/db/queries";

export async function GET(request: Request) {
  const projectId = new URL(request.url).searchParams.get("projectId") ?? undefined;
  const rounds = await listRounds(projectId);
  return NextResponse.json({ rounds });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);

  if (!body || typeof body.projectId !== "string" || !body.projectId) {
    return NextResponse.json({ error: "projectId is required" }, { status: 400 });
  }
  if (typeof body.screenshotRef !== "string" || !body.screenshotRef) {
    return NextResponse.json({ error: "screenshotRef is required" }, { status: 400 });
  }
  if (typeof body.designGoal !== "string" || !body.designGoal.trim()) {
    return NextResponse.json({ error: "designGoal is required" }, { status: 400 });
  }
  if (typeof body.feedbackText !== "string" || !body.feedbackText.trim()) {
    return NextResponse.json({ error: "feedbackText is required" }, { status: 400 });
  }

  const round = await createRound({
    projectId: body.projectId,
    previousRoundId: body.previousRoundId ?? null,
    screenshotRef: body.screenshotRef,
    designGoal: body.designGoal,
    feedbackText: body.feedbackText,
    reviewerContext: body.reviewerContext ?? null,
    constraints: body.constraints ?? null,
    critique: body.critique ?? null,
    directions: body.directions ?? [],
    selectedDirectionId: body.selectedDirectionId ?? null,
    generatedCode: body.generatedCode ?? [],
    approvalStatus: body.approvalStatus ?? "pending",
  });

  return NextResponse.json({ round }, { status: 201 });
}
