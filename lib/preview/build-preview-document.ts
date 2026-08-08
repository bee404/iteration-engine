import { transform } from "sucrase";

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

export function transpilePreviewComponent(source: string): TranspileResult {
  const normalized = stripCodeFences(source);
  if (!normalized.trim()) {
    return { ok: false, error: "The generated code is empty." };
  }
  try {
    const { code } = transform(normalized, {
      transforms: ["typescript", "jsx", "imports"],
      jsxRuntime: "classic",
      jsxPragma: "React.createElement",
      jsxFragmentPragma: "React.Fragment",
      production: true,
    });
    return { ok: true, code, componentName: extractComponentName(normalized) };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : String(error) };
  }
}

/** Neutralizes a closing script tag inside injected source so it can't break out of the
 * <script> block it is embedded in. */
function escapeScript(code: string): string {
  return code.replace(/<\/script>/gi, "<\\/script>");
}

interface PreviewDocumentParams {
  transpiledCode: string;
  componentName: string | null;
  /** Absolute URL of the vendored React runtime (public/preview-runtime/react-globals.js). */
  runtimeUrl: string;
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
export function buildPreviewDocument({ transpiledCode, componentName, runtimeUrl }: PreviewDocumentParams): string {
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
    <style>
      html, body { margin: 0; padding: 0; background: #ffffff; color: #0a0a0a;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
      #root { min-height: 100vh; }
    </style>
  </head>
  <body>
    <div id="root"></div>
    <script src="${runtimeUrl}"><\/script>
    <script>${bootstrap}<\/script>
  </body>
</html>`;
}

