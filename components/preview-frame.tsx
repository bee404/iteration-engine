"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { GeneratedCodeStatus } from "@/lib/types";
import {
  buildPreviewDocument,
  buildStreamingSourceDocument,
  nextStreamingSourceMessage,
  transpilePreviewComponent,
} from "@/lib/preview/build-preview-document";
import { REACT_RUNTIME_SOURCE } from "@/lib/preview/react-runtime.generated";

interface PreviewFrameProps {
  code: string;
  language: string;
  status: GeneratedCodeStatus;
}

/**
 * Renders a direction's generated code. Once generation is complete it transpiles the TSX
 * with Sucrase and mounts it as a live, interactive component inside a sandboxed iframe.
 * While the code is still streaming it shows the accumulated source in a load-once iframe fed
 * incrementally over postMessage (no per-token reload); after a codegen error it shows that
 * source as read-only text, and if the completed code fails to transpile or throws at mount
 * it falls back to the same read-only source view with a notice — never a blank frame.
 */
export function PreviewFrame({ code, language, status }: PreviewFrameProps) {
  // While streaming, the source is pushed into a load-once iframe token by token, so the pane
  // never reloads mid-stream (the cause of the blank-frame QA captures). A settled codegen
  // error keeps the plain read-only source view; a complete run mounts the live component.
  if (status === "streaming") {
    return <StreamingSourceView code={code} language={language} />;
  }
  if (status === "error") {
    return <SourceView code={code} language={language} />;
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
        notice={`Couldn't render this as live UI — showing the source instead. ${transpiled.error}`}
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