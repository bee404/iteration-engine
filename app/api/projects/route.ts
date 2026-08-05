import { NextResponse } from "next/server";
import { createProject, listProjects } from "@/lib/db/queries";

export async function GET() {
  const projects = await listProjects();
  return NextResponse.json({ projects });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);

  if (!body || typeof body.name !== "string" || !body.name.trim()) {
    return NextResponse.json({ error: "name is required" }, { status: 400 });
  }

  const project = await createProject({ name: body.name, description: body.description });
  return NextResponse.json({ project }, { status: 201 });
}
