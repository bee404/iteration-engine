import { NextResponse } from "next/server";
import { isDemoMode } from "@/lib/demo-mode";
import { createRound, listRounds } from "@/lib/db/queries";
import type { ImageDimensions } from "@/lib/types";
import { authorizeRequest } from "@/lib/security/access";
import { resolveScreenshotDataUrl, ScreenshotValidationError } from "@/lib/security/screenshot";

/** Accepts a dimension pair from the request body only when both values are finite
 * positive numbers; anything else (missing, partial, malformed) is treated as absent. */
function parseDimensions(value: unknown): ImageDimensions | null {
  if (!value || typeof value !== "object") return null;
  const { width, height } = value as Record<string, unknown>;
  if (typeof width !== "number" || typeof height !== "number") return null;
  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) return null;
  return { width, height };
}

export async function GET(request: Request) {
  const denied = authorizeRequest(request);
  if (denied) return denied;
  const projectId = new URL(request.url).searchParams.get("projectId") ?? undefined;
  const rounds = await listRounds(projectId);
  return NextResponse.json({ rounds });
}

export async function POST(request: Request) {
  const denied = authorizeRequest(request);
  if (denied) return denied;

  // Demo mode never persists — refuse the write cleanly rather than touching Turso.
  if (isDemoMode()) {
    return NextResponse.json({ error: "Persistence is disabled in demo mode", code: "demo_mode" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);

  if (!body || typeof body.projectId !== "string" || !body.projectId) {
    return NextResponse.json({ error: "projectId is required" }, { status: 400 });
  }
  if (typeof body.screenshotRef !== "string" || !body.screenshotRef) {
    return NextResponse.json({ error: "screenshotRef is required" }, { status: 400 });
  }
  try {
    resolveScreenshotDataUrl(body.screenshotRef);
  } catch (error) {
    if (error instanceof ScreenshotValidationError) {
      return NextResponse.json({ error: error.message, code: "invalid_screenshot" }, { status: 400 });
    }
    throw error;
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
    screenshotDimensions: parseDimensions(body.screenshotDimensions),
    lockedViewport: parseDimensions(body.lockedViewport),
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
