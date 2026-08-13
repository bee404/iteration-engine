"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { GeneratedCodeStatus } from "@/lib/types";
import { buildPreviewDocument, transpilePreviewComponent } from "@/lib/preview/build-preview-document";
import { errorFallbackNotice, PREVIEW_FALLBACK_PREFIX } from "@/lib/preview/preview-fallback";
import { REACT_RUNTIME_SOURCE } from "@/lib/preview/react-runtime.generated";

interface PreviewFrameProps {
  code: string;
  language: string;
  status: GeneratedCodeStatus;
  /** Populated when status is "error": the typed codegen failure (e.g. a truncated_response
   * from hitting the output-token ceiling). Threaded through so the error path shows the same
   * explicit fallback banner as a transpile/mount failure instead of a bannerless source view. */
  error?: string;
}

/**
 * Renders a direction's generated code. Once generation is complete it transpiles the TSX
 * with Sucrase and mounts it as a live, interactive component inside a sandboxed iframe.
 * While the code is still streaming it shows the accumulated source as read-only text. If the
 * generation errors, or the completed code fails to transpile or throws at mount, it falls back
 * to that same source view with an explicit banner explaining why — never a blank frame and
 * never a bannerless "silent stall".
 */
export function PreviewFrame({ code, language, status, error }: PreviewFrameProps) {
  // A failed generation (most commonly a truncated_response from exceeding the token ceiling)
  // still has partial source worth showing, but it must come with the fallback banner — the
  // silent stall PR #16 QA caught was exactly this path rendering source with no signal.
  const errorNotice = errorFallbackNotice(status, error);
  if (errorNotice) {
    return <SourceView code={code} language={language} notice={errorNotice} />;
  }
  if (status !== "complete") {
    return <SourceView code={code} language={language} />;
  }
  return <LiveMount code={code} language={language} />;
}

function LiveMount({ code, language }: { code: string; language: string }) {
  const transpiled = useMemo(() => transpilePreviewComponent(code), [code]);
  const srcDoc = useMemo(
    () =>
      transpiled.ok
        ? buildPreviewDocument({
            transpiledCode: transpiled.code,
            componentName: transpiled.componentName,
            runtimeSource: REACT_RUNTIME_SOURCE,
          })
        : null,
    [transpiled],
  );

  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [mountError, setMountError] = useState<string | null>(null);

  // Clear a stale mount error when the document to mount changes (new code, or a retry).
  // Adjusting state during render is React's recommended alternative to a reset effect.
  const [mountedDoc, setMountedDoc] = useState(srcDoc);
  if (srcDoc !== mountedDoc) {
    setMountedDoc(srcDoc);
    setMountError(null);
  }

  // The sandboxed iframe can't be reached across its opaque origin, so it reports mount
  // failures back over postMessage.
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.source !== iframeRef.current?.contentWindow) return;
      const data = event.data;
      if (data && typeof data === "object" && data.type === "preview-mount-error") {
        setMountError(typeof data.message === "string" ? data.message : "The component failed to render.");
      }
    };
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  if (!transpiled.ok) {
    return (
      <SourceView
        code={code}
        language={language}
        notice={`${PREVIEW_FALLBACK_PREFIX} ${transpiled.error}`}
      />
    );
  }
  if (mountError) {
    return (
      <SourceView
        code={code}
        language={language}
        notice={`This component compiled but failed to mount — showing the source instead. ${mountError}`}
      />
    );
  }

  return (
    <iframe
      ref={iframeRef}
      title={`Live ${language} preview`}
      className="preview-frame"
      sandbox="allow-scripts"
      srcDoc={srcDoc ?? undefined}
    />
  );
}

/** Read-only source view: the generated code escaped into a <pre> inside a script-less
 * iframe. Used while streaming, and as the fallback when a live mount isn't possible. */
function SourceView({ code, language, notice }: { code: string; language: string; notice?: string }) {
  const doc = useMemo(() => sourceDocument(code), [code]);
  const frame = (
    <iframe title={`Generated ${language} source`} className="preview-frame" sandbox="" srcDoc={doc} />
  );
  if (!notice) return frame;
  return (
    <div className="preview-shell">
      <p className="preview-notice" role="status">
        {notice}
      </p>
      {frame}
    </div>
  );
}

function sourceDocument(code: string): string {
  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <style>
      body { margin: 0; font-family: ui-monospace, monospace; background: #0b0d12; color: #d7dce2; }
      pre { margin: 0; padding: 16px; white-space: pre-wrap; word-break: break-word; font-size: 13px; line-height: 1.5; }
    </style>
  </head>
  <body>
    <pre>${escapeHtml(code)}</pre>
  </body>
</html>`;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}