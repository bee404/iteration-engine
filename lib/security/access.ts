import { timingSafeEqual } from "node:crypto";
import { isDemoMode } from "@/lib/demo-mode";
import { logSecurityEvent } from "./events";

const ACCESS_REALM = 'Basic realm="Coquí", charset="UTF-8"';

export interface AccessConfiguration {
  mode: "open" | "protected" | "misconfigured";
  username?: string;
  password?: string;
}

function readAccessConfiguration(): AccessConfiguration {
  const username = process.env.COQUI_ACCESS_USERNAME?.trim();
  const password = process.env.COQUI_ACCESS_PASSWORD;

  if (username && password) {
    return { mode: "protected", username, password };
  }
  if (username || password) {
    return { mode: "misconfigured" };
  }

  // Public fixture previews are safe: provider factories make no external model calls and
  // every persistence write is refused. Live production fails closed until both credentials
  // are configured. Local development remains frictionless.
  if (process.env.NODE_ENV === "production" && !isDemoMode()) {
    return { mode: "misconfigured" };
  }
  return { mode: "open" };
}

function constantTimeEqual(actual: string, expected: string): boolean {
  const actualBytes = Buffer.from(actual);
  const expectedBytes = Buffer.from(expected);
  if (actualBytes.length !== expectedBytes.length) return false;
  return timingSafeEqual(actualBytes, expectedBytes);
}

function readBasicCredentials(header: string | null): { username: string; password: string } | null {
  if (!header?.startsWith("Basic ")) return null;
  try {
    const decoded = Buffer.from(header.slice("Basic ".length), "base64").toString("utf8");
    const separator = decoded.indexOf(":");
    if (separator < 0) return null;
    return {
      username: decoded.slice(0, separator),
      password: decoded.slice(separator + 1),
    };
  } catch {
    return null;
  }
}

function securityResponse(status: 401 | 503, message: string): Response {
  const headers = new Headers({
    "Cache-Control": "no-store",
    "Content-Type": "application/json; charset=utf-8",
  });
  if (status === 401) headers.set("WWW-Authenticate", ACCESS_REALM);
  return new Response(JSON.stringify({ error: message }), { status, headers });
}

/**
 * Returns null when the request may continue, otherwise a response that must be returned
 * immediately. This guard is called both at the network boundary (proxy.ts) and by every API
 * route so a future matcher/configuration mistake cannot expose model or database operations.
 */
export function authorizeRequest(
  request: Request,
  config: AccessConfiguration = readAccessConfiguration(),
): Response | null {
  const pathname = new URL(request.url).pathname;

  if (config.mode === "open") return null;
  if (config.mode === "misconfigured") {
    logSecurityEvent("access_misconfigured", { pathname });
    return securityResponse(
      503,
      "Live production access is disabled until COQUI_ACCESS_USERNAME and COQUI_ACCESS_PASSWORD are both configured.",
    );
  }

  const supplied = readBasicCredentials(request.headers.get("authorization"));
  const valid =
    supplied !== null &&
    constantTimeEqual(supplied.username, config.username ?? "") &&
    constantTimeEqual(supplied.password, config.password ?? "");
  if (valid) return null;

  logSecurityEvent("access_denied", { pathname });
  return securityResponse(401, "Authentication required.");
}
