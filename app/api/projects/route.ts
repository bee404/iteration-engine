import { NextResponse } from "next/server";
import { isDemoMode } from "@/lib/demo-mode";
import { createProject, listProjects } from "@/lib/db/queries";
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

  // Demo mode never persists — refuse the write cleanly rather than touching Turso.
  if (isDemoMode()) {
    return NextResponse.json({ error: "Persistence is disabled in demo mode", code: "demo_mode" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);

  if (!body || typeof body.name !== "string" || !body.name.trim()) {
    return NextResponse.json({ error: "name is required" }, { status: 400 });
  }

  const project = await createProject({ name: body.name, description: body.description });
  return NextResponse.json({ project }, { status: 201 });
}
