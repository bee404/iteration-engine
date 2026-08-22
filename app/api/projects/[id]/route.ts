import { NextResponse } from "next/server";
import { getProject } from "@/lib/db/queries";
import { authorizeRequest } from "@/lib/security/access";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const denied = authorizeRequest(_request);
  if (denied) return denied;
  const { id } = await params;
  const project = await getProject(id);

  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  return NextResponse.json({ project });
}
