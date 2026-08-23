import { strToU8, zipSync } from "fflate";
import { extractComponentName } from "./preview/build-preview-document";
import type { Direction } from "./types";

/**
 * Export (Decision 14, docs/decisions.md #14) ships a standalone Vite + React project, not
 * just the bare component file, so the approved direction can actually run outside Coquí's
 * sandboxed preview iframe. Dependencies are pinned to the same React release the preview
 * vendors (lib/preview/react-runtime.generated.ts) so unpacking and running the bundle
 * reproduces exactly what was approved.
 */
const REACT_VERSION = "19.2.8";
const TYPES_REACT_VERSION = "19.2.18";
const TYPES_REACT_DOM_VERSION = "19.2.4";
const TYPESCRIPT_VERSION = "6.0.3";

export interface ExportBundleInput {
  direction: Pick<Direction, "title">;
  code: string;
  designGoal: string;
  /** Included in the README for traceability when the round has already been saved. */
  roundId?: string | null;
}

export interface ExportBundleResult {
  fileName: string;
  bytes: Uint8Array<ArrayBuffer>;
}

function slugify(value: string): string {
  const slug = value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug || "direction";
}

/**
 * The codegen system prompt only asks for "a single self-contained component," not for it to
 * be exported (see claude-provider.ts) — extractComponentName's fallback patterns exist for
 * exactly this reason. Appends a default export when one isn't already present so the
 * standalone entry point always has a concrete, importable identifier.
 */
function ensureDefaultExport(code: string, componentName: string): string {
  if (/export\s+default\b/.test(code)) return code;
  return `${code.replace(/\s+$/, "")}\n\nexport default ${componentName};\n`;
}

function buildPackageJson(slug: string): string {
  const manifest = {
    name: `coqui-export-${slug}`,
    private: true,
    version: "0.1.0",
    type: "module",
    scripts: {
      dev: "vite",
      build: "vite build",
      preview: "vite preview",
    },
    dependencies: {
      react: REACT_VERSION,
      "react-dom": REACT_VERSION,
    },
    devDependencies: {
      "@types/react": TYPES_REACT_VERSION,
      "@types/react-dom": TYPES_REACT_DOM_VERSION,
      "@vitejs/plugin-react": "^6.1.0",
      typescript: TYPESCRIPT_VERSION,
      vite: "^8.2.2",
    },
  };
  return `${JSON.stringify(manifest, null, 2)}\n`;
}

function buildViteConfig(): string {
  return `import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
});
`;
}

function buildTsconfig(): string {
  const config = {
    compilerOptions: {
      target: "ES2022",
      lib: ["ES2022", "DOM", "DOM.Iterable"],
      module: "ESNext",
      moduleResolution: "Bundler",
      jsx: "react-jsx",
      strict: true,
      skipLibCheck: true,
      esModuleInterop: true,
      isolatedModules: true,
      noEmit: true,
    },
    include: ["src"],
  };
  return `${JSON.stringify(config, null, 2)}\n`;
}

function buildIndexHtml(directionTitle: string): string {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${directionTitle}</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
`;
}

function buildMainEntry(componentName: string): string {
  return `import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import ${componentName} from "./${componentName}";

const container = document.getElementById("root");
if (!container) throw new Error("Root element #root not found");

createRoot(container).render(
  <StrictMode>
    <${componentName} />
  </StrictMode>,
);
`;
}

function buildReadme(params: {
  directionTitle: string;
  designGoal: string;
  componentFile: string;
  roundId?: string | null;
}): string {
  const { directionTitle, designGoal, componentFile, roundId } = params;
  const roundLine = roundId ? `\n- Round: \`${roundId}\`` : "";
  return `# ${directionTitle}

Standalone export of one approved direction from a Coquí design-iteration round.

- Direction: **${directionTitle}**
- Design goal: ${designGoal}${roundLine}

## Contents

- \`src/${componentFile}\` — the generated component, exactly as approved in Coquí.
- \`src/main.tsx\` — mounts the component into \`index.html\` with React 19.
- Minimal Vite + TypeScript scaffolding so the component runs outside Coquí's sandboxed preview.

## Run it

\`\`\`sh
npm install
npm run dev
\`\`\`

Then open the printed local URL. \`npm run build\` produces a static production bundle in \`dist/\`.
`;
}

/**
 * Assembles the standalone export as an in-memory zip. Pure and DOM-free so it's testable in
 * isolation; the actual download trigger lives in downloadExportBundle below.
 */
export function buildExportBundle(input: ExportBundleInput): ExportBundleResult {
  const componentName = extractComponentName(input.code) ?? "GeneratedPreview";
  const code = ensureDefaultExport(input.code, componentName);
  const slug = slugify(input.direction.title);
  const componentFile = `${componentName}.tsx`;

  const files: Record<string, Uint8Array<ArrayBuffer>> = {
    "package.json": strToU8(buildPackageJson(slug)),
    "README.md": strToU8(
      buildReadme({ directionTitle: input.direction.title, designGoal: input.designGoal, componentFile, roundId: input.roundId }),
    ),
    "index.html": strToU8(buildIndexHtml(input.direction.title)),
    "vite.config.ts": strToU8(buildViteConfig()),
    "tsconfig.json": strToU8(buildTsconfig()),
    "src/main.tsx": strToU8(buildMainEntry(componentName)),
    [`src/${componentFile}`]: strToU8(code),
  };

  return { fileName: `${slug}.zip`, bytes: zipSync(files, { level: 6 }) };
}

/**
 * Side-effecting: triggers a browser download of the assembled zip. Kept separate from
 * buildExportBundle so the assembly logic above stays pure and unit-testable without a DOM.
 */
export function downloadExportBundle(result: ExportBundleResult): void {
  const blob = new Blob([result.bytes], { type: "application/zip" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = result.fileName;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

