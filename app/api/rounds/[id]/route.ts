import { NextResponse } from "next/server";
import { getRound } from "@/lib/db/queries";
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

export async function PATCH(request: Request) {
  const denied = authorizeRequest(request);
  if (denied) return denied;
  return NextResponse.json(
    { error: "Approval persistence is retired from the V0 exploration flow", code: "persistence_retired" },
    { status: 410 },
  );
}
