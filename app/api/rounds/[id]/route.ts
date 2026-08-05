import { NextResponse } from "next/server";
import { getRound, updateRoundApproval } from "@/lib/db/queries";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const round = await getRound(id);

  if (!round) {
    return NextResponse.json({ error: "Round not found" }, { status: 404 });
  }

  return NextResponse.json({ round });
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json().catch(() => null);

  if (!body || !["pending", "approved", "rejected"].includes(body.approvalStatus)) {
    return NextResponse.json({ error: "approvalStatus must be pending, approved, or rejected" }, { status: 400 });
  }

  await updateRoundApproval(id, body.approvalStatus, body.selectedDirectionId ?? null);
  const round = await getRound(id);

  return NextResponse.json({ round });
}
