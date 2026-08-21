import { transform } from "sucrase";

/** Generated previews may execute inline React, but they cannot reach the network, submit
 * forms, load plugins, or change their base URL. The iframe sandbox remains a separate layer. */
export const PREVIEW_CONTENT_SECURITY_POLICY =
  "default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; font-src data:; img-src data: blob:; connect-src 'none'; media-src 'none'; object-src 'none'; base-uri 'none'; form-action 'none'";

/**
 * Turns a single self-contained generated React component (TSX source) into an HTML document
 * that transpiles and mounts it live inside a sandboxed iframe. The generated code is always
 * one file with no imports to resolve (enforced by the codegen system prompt), so Sucrase's
 * type-stripping transform is the right-sized tool — no bundler needed (Findings Log, Research
 * Finding 7). All logic here is pure and string-in/string-out so it can be unit tested without
 * a DOM; the actual mounting happens in the iframe via the document this builds.
 */

export type TranspileResult =
  | { ok: true; code: string; componentName: string | null }
  | { ok: false; error: string };

/**
 * Models sometimes wrap output in a markdown code fence despite being told not to; a stray
 * fence is a syntax error that would otherwise fail transpilation. Strip a leading ```lang
 * line and a trailing ``` line when present, leaving genuine source untouched.
 */
export function stripCodeFences(source: string): string {
  const trimmed = source.trim();
  if (!trimmed.startsWith("```")) return source;
  return trimmed
    .replace(/^```[^\n]*\n/, "")
    .replace(/\n?```\s*$/, "");
}

const COMPONENT_NAME_PATTERNS: readonly RegExp[] = [
  /export\s+default\s+function\s+([A-Za-z_$][\w$]*)/,
  /export\s+default\s+class\s+([A-Za-z_$][\w$]*)/,
  /export\s+default\s+([A-Z][\w$]*)\s*[;\n]/,
  /function\s+([A-Z][\w$]*)\s*\(/,
  /(?:const|let|var)\s+([A-Z][\w$]*)\s*[:=]/,
];

/**
 * Best-effort discovery of the component's identifier from source. Used to register a
 * component that is declared but never exported — a shape the generator can produce, since it
 * is only told to output "a single self-contained component," not to export it. Returns null
 * when nothing matches; the iframe bootstrap then falls back to any default/first export.
 */
export function extractComponentName(source: string): string | null {
  for (const pattern of COMPONENT_NAME_PATTERNS) {
    const match = pattern.exec(source);
    if (match && match[1]) return match[1];
  }
  return null;
}

/**
 * Sucrase transform with this app's fixed options. Split out so both the first attempt and
 * each post-repair re-check in transpilePreviewComponent run the exact same transform — a
 * repair is only ever trusted because *this* function accepts its output.
 */
function runSucrase(source: string): TranspileResult {
  try {
    const { code } = transform(source, {
      transforms: ["typescript", "jsx", "imports"],
      jsxRuntime: "classic",
      jsxPragma: "React.createElement",
      jsxFragmentPragma: "React.Fragment",
      production: true,
    });
    return { ok: true, code, componentName: extractComponentName(source) };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : String(error) };
  }
}

// A line that plausibly opens real code, used to find where a component starts when the model
// wraps it in prose ("Here is the component:") the fence-stripper doesn't catch.
const CODE_START_LINE =
  /^\s*(import\b|export\b|const\b|let\b|var\b|function\b|async\b|class\b|interface\b|type\b|enum\b|declare\b|namespace\b|"use |'use |\/\*|\/\/|@|React\b)/;
// A line that plausibly closes a statement or block, used to find where the component ends
// before any trailing prose ("Let me know if you want tweaks.").
const CODE_END_LINE = /[)\]};]\s*$|`\s*$/;

/**
 * Drops explanatory prose the model sometimes emits before or after the component despite
 * being told to output raw source only. Keeps the span from the first code-like line to the
 * last statement-closing line; leaves genuine source (which starts and ends with code) intact.
 */
export function stripSurroundingProse(source: string): string {
  const lines = source.split("\n");
  const lineAt = (i: number): string => lines[i] ?? "";
  let start = 0;
  while (start < lines.length && lineAt(start).trim() !== "" && !CODE_START_LINE.test(lineAt(start))) {
    start += 1;
  }
  if (start >= lines.length) start = 0;
  while (start < lines.length && lineAt(start).trim() === "") start += 1;

  let end = lines.length - 1;
  while (end > start && (lineAt(end).trim() === "" || !CODE_END_LINE.test(lineAt(end)))) {
    end -= 1;
  }
  return lines.slice(start, end + 1).join("\n");
}

// CSS units the model may append to a bare numeric value inside an inline-style object
// (`maxWidth: 480px`), which is a syntax error — the value must be a quoted string.
const CSS_UNIT =
  "(?:px|rem|em|ex|ch|vw|vh|vmin|vmax|pt|pc|cm|mm|in|%|fr|deg|grad|rad|turn|ms|s|dvh|dvw|svh|lvh)";
const UNITFUL_STYLE_VALUE = new RegExp(`([:,]\\s*)(-?\\d*\\.?\\d+${CSS_UNIT})(\\s*[,}\\n])`, "g");

/**
 * Quotes unitful numeric CSS values in object-literal value position (`padding: 24px` ->
 * `padding: '24px'`). Unitless numbers (`opacity: 1`, `zIndex: 10`) are valid and left alone.
 */
export function quoteUnitfulStyleValues(source: string): string {
  return source.replace(UNITFUL_STYLE_VALUE, (_m, pre, value, post) => `${pre}'${value}'${post}`);
}

/**
 * Wraps raw CSS written as the children of a JSX `<style>` element in a template literal
 * (`<style>.x{}</style>` -> `` <style>{`.x{}`}</style> ``). Left untouched when the children
 * are already a `{...}` expression container, so a correctly-authored style block is a no-op.
 */
export function wrapBareStyleTagCss(source: string): string {
  return source.replace(/<style([^>]*)>([\s\S]*?)<\/style>/g, (match, attrs: string, body: string) => {
    if (/^\s*\{/.test(body)) return match;
    const escaped = body.replace(/`/g, "\\`").replace(/\$\{/g, "\\${");
    return `<style${attrs}>{\`${escaped}\`}</style>`;
  });
}

/**
 * Deterministic repairs for the syntax mistakes real LLM codegen makes most often that
 * Sucrase can't parse. Applied cumulatively and only ever *adopted* when the repaired source
 * actually transpiles (see transpilePreviewComponent), so a repair that doesn't apply — or
 * makes things worse — is discarded and never mounted. Order is cheapest/safest first.
 */
const SYNTAX_REPAIRS: readonly ((source: string) => string)[] = [
  stripSurroundingProse,
  quoteUnitfulStyleValues,
  wrapBareStyleTagCss,
];

/**
 * Transpiles the generated component, self-healing the common LLM syntax slips before giving
 * up. It first transpiles as-is; on a syntax error it applies the deterministic repairs above
 * cumulatively, adopting the result the moment Sucrase accepts it. Only when every repair
 * still fails to parse does it return the original error — the signal PreviewFrame degrades to
 * its read-only source view from, keeping that fallback a last resort rather than the norm.
 */
export function transpilePreviewComponent(source: string): TranspileResult {
  const normalized = stripCodeFences(source);
  if (!normalized.trim()) {
    return { ok: false, error: "The generated code is empty." };
  }

  const firstAttempt = runSucrase(normalized);
  if (firstAttempt.ok) return firstAttempt;

  let candidate = normalized;
  for (const repair of SYNTAX_REPAIRS) {
    const repaired = repair(candidate);
    if (repaired === candidate) continue;
    candidate = repaired;
    const attempt = runSucrase(candidate);
    if (attempt.ok) return attempt;
  }

  return firstAttempt;
}

/** Neutralizes a closing script tag inside injected source so it can't break out of the
 * <script> block it is embedded in. */
function escapeScript(code: string): string {
  return code.replace(/<\/script>/gi, "<\\/script>");
}

interface PreviewDocumentParams {
  transpiledCode: string;
  componentName: string | null;
  /** Source of the vendored React runtime (lib/preview/react-runtime.generated.ts), inlined
   * into the iframe rather than fetched — the sandboxed opaque-origin iframe sends no cookies,
   * so a network fetch to a deployment-protected preview 302s to SSO and never defines
   * window.React. */
  runtimeSource: string;
}

/**
 * Builds the srcDoc for the live-mount iframe. The iframe is sandboxed with only
 * `allow-scripts` (opaque origin, no parent access), so the React runtime is loaded as a
 * same-origin classic <script> and mount failures are reported back via postMessage rather
 * than thrown across the boundary. A CJS shim (module/exports/require) lets Sucrase's imports
 * transform resolve `react`/`react-dom` to the runtime globals if the component happens to
 * import them, and an error boundary plus global handlers turn any mount-time throw into a
 * single `preview-mount-error` message the parent renders its fallback from.
 */
export function buildPreviewDocument({ transpiledCode, componentName, runtimeSource }: PreviewDocumentParams): string {
  const registration = componentName
    ? `try { window.__PREVIEW_COMPONENT__ = typeof ${componentName} !== "undefined" ? ${componentName} : window.__PREVIEW_COMPONENT__; } catch (e) {}`
    : "";

  const bootstrap = `
(function () {
  var React = window.React;
  function report(message) {
    try { parent.postMessage({ type: "preview-mount-error", message: String(message) }, "*"); } catch (e) {}
  }
  window.addEventListener("error", function (event) { report(event.message || "Runtime error"); });
  window.addEventListener("unhandledrejection", function (event) {
    report((event.reason && event.reason.message) || "Unhandled promise rejection");
  });

  var require = function (name) {
    if (name === "react") return Object.assign({ __esModule: true, default: window.React }, window.React);
    if (name === "react-dom" || name === "react-dom/client") return Object.assign({ __esModule: true, default: window.ReactDOM }, window.ReactDOM);
    return {};
  };
  var module = { exports: {} };
  var exports = module.exports;

  class PreviewBoundary extends React.Component {
    constructor(props) { super(props); this.state = { failed: false }; }
    static getDerivedStateFromError() { return { failed: true }; }
    componentDidCatch(error) { report(error && error.message ? error.message : String(error)); }
    render() { return this.state.failed ? null : this.props.children; }
  }

  function firstFunctionExport(candidate) {
    if (!candidate) return null;
    for (var key in candidate) { if (typeof candidate[key] === "function") return candidate[key]; }
    return null;
  }

  try {
${escapeScript(transpiledCode)}
${registration}
    var Component = window.__PREVIEW_COMPONENT__ || (module.exports && module.exports.default) || firstFunctionExport(module.exports);
    if (typeof Component !== "function") {
      report("No React component was found in the generated code.");
      return;
    }
    var root = window.ReactDOM.createRoot(document.getElementById("root"));
    root.render(React.createElement(PreviewBoundary, null, React.createElement(Component)));
  } catch (error) {
    report(error && error.message ? error.message : String(error));
  }
})();
`;

  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta http-equiv="Content-Security-Policy" content="${PREVIEW_CONTENT_SECURITY_POLICY}" />
    <style>
      html, body { margin: 0; padding: 0; background: #ffffff; color: #0a0a0a;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
      #root { min-height: 100vh; }
    </style>
  </head>
  <body>
    <div id="root"></div>
    <script>${escapeScript(runtimeSource)}<\/script>
    <script>${bootstrap}<\/script>
  </body>
</html>`;
}

/**
 * Message posted into the streaming source iframe to update its content in place, without
 * reloading the document. `append` adds only the newly streamed suffix (the token common
 * case); `reset` replaces the whole buffer (the initial flush, or the wholesale swap when the
 * post-processed finalize source arrives while still streaming) so the view can never drift.
 */
export type StreamingSourceMessage =
  | { type: "preview-src-append"; chunk: string }
  | { type: "preview-src-reset"; text: string };

/**
 * Computes the minimal in-place update to move the streaming source view from what it has
 * already rendered (`rendered`) to the latest accumulated `code`. Returns null when there is
 * nothing to do. Pure and DOM-free so the incremental protocol can be unit tested: a stream of
 * N appended tokens yields N append messages and zero document rebuilds.
 */
export function nextStreamingSourceMessage(rendered: string, code: string): StreamingSourceMessage | null {
  if (code === rendered) return null;
  if (code.startsWith(rendered)) return { type: "preview-src-append", chunk: code.slice(rendered.length) };
  return { type: "preview-src-reset", text: code };
}

/**
 * Builds the srcDoc for the streaming source view. Unlike SourceView — which bakes the code
 * into the document and therefore reloads the iframe on every token — this document is a
 * constant for the whole streaming session: it loads once with an empty <pre> mount point and
 * a listener that applies `preview-src-*` messages in place via textContent (never innerHTML,
 * so streamed source can't inject markup). The parent posts one append per token, so the
 * iframe fires a single `load` — removing the per-token document reload that produced the
 * mid-stream blank-pane frames. Sandbox stays `allow-scripts` only (opaque origin, no parent
 * DOM access), matching the boundary LiveMount already uses.
 */
export function buildStreamingSourceDocument(): string {
  const bootstrap = `
(function () {
  var pre = document.getElementById("preview-src");
  window.addEventListener("message", function (event) {
    var data = event.data;
    if (!pre || !data || typeof data !== "object") return;
    if (data.type === "preview-src-reset") pre.textContent = typeof data.text === "string" ? data.text : "";
    else if (data.type === "preview-src-append" && typeof data.chunk === "string") pre.textContent += data.chunk;
  });
})();
`;

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
    <pre id="preview-src"></pre>
    <script>${escapeScript(bootstrap)}<\/script>
  </body>
</html>`;
}
