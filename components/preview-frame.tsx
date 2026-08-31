"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { WheelEvent as ReactWheelEvent } from "react";
import type { GeneratedCodeStatus } from "@/lib/types";
import {
  buildPreviewDocument,
  buildStreamingSourceDocument,
  nextStreamingSourceMessage,
  PREVIEW_CONTENT_SECURITY_POLICY,
  PREVIEW_WHEEL_RELAY_SCRIPT,
  transpilePreviewComponent,
} from "@/lib/preview/build-preview-document";
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

function usePreviewWheelBridge() {
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const data = event.data;
      if (!data || typeof data !== "object" || data.type !== "preview-wheel-boundary") return;

      const multiplier = data.deltaMode === 1 ? 16 : data.deltaMode === 2 ? window.innerHeight : 1;
      const deltaX = typeof data.deltaX === "number" ? data.deltaX * multiplier : 0;
      const deltaY = typeof data.deltaY === "number" ? data.deltaY * multiplier : 0;
      document.querySelector<HTMLElement>(".prototype-body")?.scrollBy({
        left: deltaX,
        top: deltaY,
      });
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);
}

function handleFrameWheel(event: ReactWheelEvent<HTMLIFrameElement>) {
  document.querySelector<HTMLElement>(".prototype-body")?.scrollBy({
    left: event.deltaX,
    top: event.deltaY,
  });
}

/**
 * Renders a direction's generated code. Once generation is complete it transpiles the TSX
 * with Sucrase and mounts it as a live, interactive component inside a sandboxed iframe.
 * While the code is still streaming it shows the accumulated source in a load-once iframe fed
 * incrementally over postMessage (no per-token reload). If the generation errors, or the
 * completed code fails to transpile or throws at mount, it falls back to a read-only source
 * view with an explicit banner explaining why — never a blank frame, and never a bannerless
 * "silent stall".
 */
export function PreviewFrame({ code, language, status, error }: PreviewFrameProps) {
  // While streaming, the source is pushed into a load-once iframe token by token, so the pane
  // never reloads mid-stream (the cause of the blank-frame QA captures).
  if (status === "streaming") {
    return <StreamingSourceView code={code} language={language} />;
  }
  // A failed generation (most commonly a truncated_response from exceeding the token ceiling)
  // still has partial source worth showing, but it must come with the fallback banner — the
  // silent stall the 10-round QA caught was exactly this path rendering source with no signal.
  // Note this deliberately replaces the bare `status === "error"` source view: that branch
  // returned the partial source with no notice at all, which is the bug being fixed here.
  const errorNotice = errorFallbackNotice(status, error);
  if (errorNotice) {
    return <SourceView code={code} language={language} notice={errorNotice} />;
  }
  return <LiveMount code={code} language={language} />;
}

/**
 * Streaming source view: the iframe document is a constant for the streaming session, so React
 * never reassigns `srcDoc` and the frame loads exactly once. Each new token is posted in over
 * postMessage as an incremental append into the already-loaded <pre>, replacing the old
 * behavior of rebuilding and reassigning the whole srcDoc (a full iframe reload) per token.
 */
function StreamingSourceView({ code, language }: { code: string; language: string }) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  usePreviewWheelBridge();
  // Stable for this mount's lifetime — this referential stability is what keeps the iframe from
  // reloading as tokens arrive.
  const srcDoc = useMemo(() => buildStreamingSourceDocument(), []);
  // The document's message listener is only live after the iframe's single `load` fires; tokens
  // that arrive before then are flushed on load.
  const isReadyRef = useRef(false);
  // What the iframe has already rendered, so each update posts only the newly streamed suffix.
  const renderedRef = useRef("");

  const pushUpdate = useCallback(() => {
    const frame = iframeRef.current?.contentWindow;
    if (!frame || !isReadyRef.current) return;
    const message = nextStreamingSourceMessage(renderedRef.current, code);
    if (!message) return;
    frame.postMessage(message, "*");
    renderedRef.current = code;
  }, [code]);

  // Fresh document: reset the rendered marker and flush everything streamed so far.
  const handleLoad = useCallback(() => {
    isReadyRef.current = true;
    renderedRef.current = "";
    pushUpdate();
  }, [pushUpdate]);

  useEffect(() => {
    pushUpdate();
  }, [pushUpdate]);

  return (
    <iframe
      ref={iframeRef}
      onWheel={handleFrameWheel}
      onLoad={handleLoad}
      title={`Streaming ${language} source`}
      className="preview-frame"
      sandbox="allow-scripts"
      srcDoc={srcDoc}
    />
  );
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
  usePreviewWheelBridge();
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
      onWheel={handleFrameWheel}
      title={`Live ${language} preview`}
      className="preview-frame"
      sandbox="allow-scripts"
      srcDoc={srcDoc ?? undefined}
    />
  );
}

/** Read-only source view: generated code is escaped into a <pre>. The only script in this
 * opaque-origin frame is the fixed wheel-boundary relay; generated source never executes. */
function SourceView({ code, language, notice }: { code: string; language: string; notice?: string }) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  usePreviewWheelBridge();
  const doc = useMemo(() => sourceDocument(code), [code]);
  const frame = (
    <iframe
      ref={iframeRef}
      onWheel={handleFrameWheel}
      title={`Generated ${language} source`}
      className="preview-frame"
      sandbox="allow-scripts"
      srcDoc={doc}
    />
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
    <meta http-equiv="Content-Security-Policy" content="${PREVIEW_CONTENT_SECURITY_POLICY}" />
    <style>
      body { margin: 0; font-family: ui-monospace, monospace; background: #0b0d12; color: #d7dce2; }
      pre { margin: 0; padding: 16px; white-space: pre-wrap; word-break: break-word; font-size: 13px; line-height: 1.5; }
    </style>
  </head>
  <body>
    <pre>${escapeHtml(code)}</pre>
    <script>${PREVIEW_WHEEL_RELAY_SCRIPT}<\/script>
  </body>
</html>`;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
