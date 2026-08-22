export type SecurityEventName =
  | "access_denied"
  | "access_misconfigured"
  | "rate_limited"
  | "screenshot_rejected";

/**
 * Emits one-line structured events that Vercel Runtime Logs can filter and alert on.
 * Values must stay low-cardinality and must never contain credentials, request bodies,
 * screenshot data, or other user-provided content.
 */
export function logSecurityEvent(
  event: SecurityEventName,
  details: Readonly<Record<string, string | number | boolean>> = {},
): void {
  console.warn(JSON.stringify({
    type: "security_event",
    event,
    at: new Date().toISOString(),
    ...details,
  }));
}
