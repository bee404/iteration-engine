"use client";

interface PreviewFrameProps {
  code: string;
  language: string;
}

/**
 * Sandboxed iframe rendering streamed generated code. Uses srcDoc so the generated
 * source never executes in the parent app's origin/context — it is display-only for
 * v1 (a real bundler/transform step would be needed to actually mount the component;
 * this renders it as readable, continuously-updating source while streaming).
 */
export function PreviewFrame({ code, language }: PreviewFrameProps) {
  const doc = `<!doctype html>
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

  return (
    <iframe
      title={`Generated ${language} preview`}
      className="preview-frame"
      sandbox="allow-scripts"
      srcDoc={doc}
    />
  );
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
