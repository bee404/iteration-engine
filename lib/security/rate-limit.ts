import { logSecurityEvent } from "./events";

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

interface RateLimitPolicy {
  name: string;
  limit: number;
  windowMs: number;
}

const globalRateLimits = globalThis as typeof globalThis & {
  __coquiRateLimits?: Map<string, RateLimitEntry>;
};

const entries = globalRateLimits.__coquiRateLimits ?? new Map<string, RateLimitEntry>();
globalRateLimits.__coquiRateLimits = entries;

function clientKey(request: Request): string {
  // Vercel overwrites x-forwarded-for at its trusted network boundary. The value is used only
  // to partition this best-effort limiter, never for authorization or audit identity.
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
}

/**
 * Best-effort per-instance protection for expensive model endpoints. Vercel's platform
 * firewall remains the distributed DDoS layer; this limiter bounds ordinary bursts and emits
 * a structured event whenever it blocks a request.
 */
export function enforceRateLimit(request: Request, policy: RateLimitPolicy): Response | null {
  const now = Date.now();
  const key = `${policy.name}:${clientKey(request)}`;
  const existing = entries.get(key);
  const entry = !existing || existing.resetAt <= now
    ? { count: 0, resetAt: now + policy.windowMs }
    : existing;

  entry.count += 1;
  entries.set(key, entry);

  if (entry.count <= policy.limit) return null;

  const retryAfterSeconds = Math.max(1, Math.ceil((entry.resetAt - now) / 1000));
  logSecurityEvent("rate_limited", { policy: policy.name, retryAfterSeconds });
  return new Response(JSON.stringify({ error: "Too many requests. Please wait and try again." }), {
    status: 429,
    headers: {
      "Cache-Control": "no-store",
      "Content-Type": "application/json; charset=utf-8",
      "Retry-After": String(retryAfterSeconds),
    },
  });
}

export const MODEL_RATE_LIMITS = {
  critique: { name: "critique", limit: 12, windowMs: 60_000 },
  directions: { name: "directions", limit: 12, windowMs: 60_000 },
  generate: { name: "generate", limit: 6, windowMs: 60_000 },
} as const satisfies Record<string, RateLimitPolicy>;
