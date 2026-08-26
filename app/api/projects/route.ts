import { NextResponse } from "next/server";
import { listProjects } from "@/lib/db/queries";
import { authorizeRequest } from "@/lib/security/access";

export async function GET(request: Request) {
  const denied = authorizeRequest(request);
  if (denied) return denied;
  const projects = await listProjects();
  return NextResponse.json({ projects });
}

export async function POST(request: Request) {
  const denied = authorizeRequest(request);
  if (denied) return denied;
  return NextResponse.json(
    { error: "Project persistence is retired from the V0 exploration flow", code: "persistence_retired" },
    { status: 410 },
  );
}
