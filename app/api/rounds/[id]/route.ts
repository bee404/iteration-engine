import { NextResponse } from "next/server";
import { isDemoMode } from "@/lib/demo-mode";
import { getRound, updateRoundApproval } from "@/lib/db/queries";
import { authorizeRequest } from "@/lib/security/access";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const denied = authorizeRequest(_request);
  if (denied) return denied;
  const { id } = await params;
  const round = await getRound(id);

  if (!round) {
    return NextResponse.json({ error: "Round not found" }, { status: 404 });
  }

  return NextResponse.json({ round });
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const denied = authorizeRequest(request);
  if (denied) return denied;

  // Demo mode never persists — refuse the write cleanly rather than touching Turso.
  if (isDemoMode()) {
    return NextResponse.json({ error: "Persistence is disabled in demo mode", code: "demo_mode" }, { status: 403 });
  }

  const { id } = await params;
  const body = await request.json().catch(() => null);

  if (!body || !["pending", "approved", "rejected"].includes(body.approvalStatus)) {
    return NextResponse.json({ error: "approvalStatus must be pending, approved, or rejected" }, { status: 400 });
  }

  await updateRoundApproval(id, body.approvalStatus, body.selectedDirectionId ?? null);
  const round = await getRound(id);

  return NextResponse.json({ round });
}
