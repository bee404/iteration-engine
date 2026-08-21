import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { authorizeRequest } from "@/lib/security/access";

export function proxy(request: NextRequest): Response {
  return authorizeRequest(request) ?? NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|icon.png|.*\\.(?:svg|png|jpg|jpeg|gif|webp|woff|woff2)$).*)",
  ],
};
