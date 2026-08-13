import type { GeneratedCodeStatus } from "@/lib/types";

/**
 * One consistent fallback headline, whatever the underlying cause. A generated component that
 * does not mount as live UI — truncated output, unparseable source, or a mount-time throw —
 * must never sit in the read-only source view with no explanation (the "silent stall" the PR #16
 * QA caught). The specific reason is appended after this prefix.
 */
export const PREVIEW_FALLBACK_PREFIX = "Couldn't render this as live UI — showing the source instead.";

/**
 * The banner text a failed generation must show instead of a bannerless source view. Returns
 * null for non-error statuses: while streaming, the plain source view (with its spinner) is the
 * correct in-progress state; once complete, LiveMount builds its own transpile/mount notices.
 * Only the "error" status previously fell through to a source view with no signal — most often a
 * truncated_response after hitting the output-token ceiling — so it always resolves to a notice
 * here. Pure and DOM-free so the guarantee is unit-testable without rendering the component.
 */
export function errorFallbackNotice(
  status: GeneratedCodeStatus,
  error: string | undefined,
): string | null {
  if (status !== "error") return null;
  const reason = error?.trim()
    ? error.trim()
    : "The code couldn't be generated, so there's nothing to mount.";
  return `${PREVIEW_FALLBACK_PREFIX} ${reason}`;
}

