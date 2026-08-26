import { NextResponse } from "next/server";
import { listRounds } from "@/lib/db/queries";
import { authorizeRequest } from "@/lib/security/access";

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
  return NextResponse.json(
    { error: "Round persistence is retired from the V0 exploration flow", code: "persistence_retired" },
    { status: 410 },
  );
}
